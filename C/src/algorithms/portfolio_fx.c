#include "algorithms/portfolio_fx.h"

#include <math.h>
#include <stdint.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

typedef struct FxParticle {
    float x, y;
    float vx, vy;
    float r;
    float hue;
    float a;
    float phase;
    float phase_speed;
} FxParticle;

enum {
    FX_MAX_PARTICLES = 420,
    FX_PARTICLE_STRIDE_FLOATS = 9, /* x,y,vx,vy,r,hue,a,phase,phase_speed */
};

static FxParticle g_particles[FX_MAX_PARTICLES];
static int g_particle_count = 0;

static int g_width = 0;
static int g_height = 0;
static float g_dpr = 1.0f;

static int g_is_touch = 0;

static float g_pointer_x = 0.0f;
static float g_pointer_y = 0.0f;
static float g_smoothed_x = 0.0f;
static float g_smoothed_y = 0.0f;

static uint32_t g_rng = 0x12345678u;

static uint32_t rng_next_u32(void) {
    // LCG (Numerical Recipes)
    g_rng = (1664525u * g_rng) + 1013904223u;
    return g_rng;
}

static float rng_next_f01(void) {
    // 24-bit mantissa
    return (float)((rng_next_u32() >> 8) & 0x00FFFFFFu) / 16777215.0f;
}

static float rng_range(float lo, float hi) {
    return lo + (hi - lo) * rng_next_f01();
}

static float clampf(float x, float lo, float hi) {
    if (x < lo) return lo;
    if (x > hi) return hi;
    return x;
}

static void particles_reset(void) {
    if (g_width <= 0 || g_height <= 0) {
        g_particle_count = 0;
        return;
    }

    /* Increase density for an underwater feel */
    const float density = (g_width < 768) ? 95.0f : 170.0f;
    const int extra = (g_width < 768) ? 40 : 90;
    const float area_mpx = ((float)g_width * (float)g_height) / 1000000.0f;
    int count = (int)floorf(area_mpx * density) + extra;
    if (count > FX_MAX_PARTICLES) count = FX_MAX_PARTICLES;
    if (count < 12) count = 12;

    g_particle_count = count;

    for (int i = 0; i < g_particle_count; i++) {
        g_particles[i].x = rng_range(0.0f, (float)g_width);
        g_particles[i].y = rng_range(0.0f, (float)g_height);
        /* Slight horizontal drift and gentle upward movement */
        g_particles[i].vx = rng_range(-0.08f, 0.08f);
        g_particles[i].vy = -rng_range(0.02f, 0.18f);
        g_particles[i].r = rng_range(1.4f, 4.6f);
        g_particles[i].hue = rng_range(180.0f, 260.0f);
        g_particles[i].a = rng_range(0.08f, 0.9f);
        g_particles[i].phase = rng_range(0.0f, 6.28318530f);
        g_particles[i].phase_speed = rng_range(0.005f, 0.035f);
    }

    g_pointer_x = (float)g_width * 0.5f;
    g_pointer_y = (float)g_height * 0.35f;
    g_smoothed_x = g_pointer_x;
    g_smoothed_y = g_pointer_y;
}

void portfoliofx_init(int width, int height, float dpr, int seed) {
    g_width = width;
    g_height = height;
    g_dpr = (dpr <= 0.0f) ? 1.0f : dpr;

    // Seed rng: avoid seed=0 giving a boring stream.
    g_rng = (uint32_t)seed ^ 0xA5A5C3C3u;
    if (g_rng == 0) g_rng = 0x6D2B79F5u;

    particles_reset();
}

void portfoliofx_resize(int width, int height, float dpr) {
    g_width = width;
    g_height = height;
    g_dpr = (dpr <= 0.0f) ? 1.0f : dpr;
    particles_reset();
}

void portfoliofx_set_pointer(float x, float y) {
    g_pointer_x = x;
    g_pointer_y = y;
}

void portfoliofx_set_is_touch(int is_touch) {
    g_is_touch = is_touch ? 1 : 0;
}

void portfoliofx_step(float dt) {
    if (g_particle_count <= 0) return;
    if (dt < 0.0f) dt = 0.0f;
    if (dt > 0.05f) dt = 0.05f;

    // Match previous JS feel (fixed blend, not dt-based).
    g_smoothed_x = g_smoothed_x + (g_pointer_x - g_smoothed_x) * 0.10f;
    g_smoothed_y = g_smoothed_y + (g_pointer_y - g_smoothed_y) * 0.10f;

    const float w = (float)g_width;
    const float h = (float)g_height;

    float influence_radius = w * 0.18f;
    if (influence_radius < 140.0f) influence_radius = 140.0f;
    if (influence_radius > 220.0f) influence_radius = 220.0f;
    const float influence_r2 = influence_radius * influence_radius;

    (void)dt; // velocities are tuned as-per-frame in the original.

    for (int i = 0; i < g_particle_count; i++) {
        FxParticle* p = &g_particles[i];

        const float dx = g_smoothed_x - p->x;
        const float dy = g_smoothed_y - p->y;
        const float dist2 = dx * dx + dy * dy;

        if (!g_is_touch && dist2 < influence_r2) {
            const float dist = sqrtf(dist2) + 1e-6f;
            const float f = (1.0f - (dist / influence_radius)) * 0.06f;
            p->vx += (dx / dist) * f;
            p->vy += (dy / dist) * f * 0.6f;
        }

        /* gentle upward current */
        p->vy -= 0.006f;

        /* per-particle sway using phase */
        p->phase += p->phase_speed;
        p->x += sinf(p->phase) * 0.6f;

        p->x += p->vx;
        p->y += p->vy;

        /* subtle damping to keep motion soft */
        p->vx *= 0.992f;
        p->vy *= 0.994f;

        if (p->x < -40.0f) p->x = w + 40.0f;
        if (p->x > w + 40.0f) p->x = -40.0f;
        if (p->y < -60.0f) p->y = h + 60.0f;
        if (p->y > h + 60.0f) p->y = -60.0f;
    }
}

float portfoliofx_get_spotlight_mx(void) {
    if (g_width <= 0) return 50.0f;
    return clampf((g_smoothed_x / (float)g_width) * 100.0f, 0.0f, 100.0f);
}

float portfoliofx_get_spotlight_my(void) {
    if (g_height <= 0) return 35.0f;
    return clampf((g_smoothed_y / (float)g_height) * 100.0f, 0.0f, 100.0f);
}

int portfoliofx_get_particle_count(void) {
    return g_particle_count;
}

int portfoliofx_get_particles_stride_floats(void) {
    return FX_PARTICLE_STRIDE_FLOATS;
}

int portfoliofx_get_particles_ptr(void) {
    // Expose as raw pointer into WASM memory.
    return (int)(uintptr_t)g_particles;
}
