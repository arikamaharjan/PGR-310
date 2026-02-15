#include "algorithms/dom_anim.h"

#include <math.h>
#include <stdint.h>

static float clampf(float x, float lo, float hi) {
    if (x < lo) return lo;
    if (x > hi) return hi;
    return x;
}

enum {
    DOMANIM_MAX = 512,
    DOMANIM_STRIDE = 10,
};

static int g_count = 0;
static int g_seed = 1;
static float g_out[DOMANIM_MAX * DOMANIM_STRIDE];

static float hashf(float x) {
    return anim_hash1(x + (float)g_seed * 0.001f);
}

void domanim_init(int count, int seed) {
    if (count < 0) count = 0;
    if (count > DOMANIM_MAX) count = DOMANIM_MAX;
    g_count = count;
    g_seed = seed == 0 ? 1 : seed;

    for (int i = 0; i < g_count; i++) {
        const int o = i * DOMANIM_STRIDE;
        g_out[o + 0] = 0.0f;  // tx
        g_out[o + 1] = 0.0f;  // ty
        g_out[o + 2] = 0.0f;  // rot
        g_out[o + 3] = 1.0f;  // scale
        g_out[o + 4] = 0.0f;  // blur
        g_out[o + 5] = 0.0f;  // hue
        g_out[o + 6] = 1.0f;  // sat
        g_out[o + 7] = 1.0f;  // alpha
        g_out[o + 8] = 0.0f;  // glow
        g_out[o + 9] = 0.0f;  // skew
    }
}

void domanim_step(float t, float dt, float scroll01, float px01, float py01) {
    (void)dt;

    scroll01 = clampf(scroll01, 0.0f, 1.0f);
    px01 = clampf(px01, 0.0f, 1.0f);
    py01 = clampf(py01, 0.0f, 1.0f);

    const float gt = t;

    for (int i = 0; i < g_count; i++) {
        const float fi = (float)i;
        const float base = hashf(fi * 13.37f);
        const float phase_offset = fi * 0.017f;

        // Multi-source noise with scroll phase offset
        const float scroll_phase = scroll01 * 2.0f + phase_offset;
        const float n = anim_fbm2(fi * 0.07f + gt * 0.09f + scroll_phase * 0.3f,
                                   base * 7.0f + gt * 0.11f, 4.0f);
        const float n2 = anim_noise2(fi * 0.12f + gt * 0.05f,
                                      base * 11.0f + gt * 0.08f + scroll_phase * 0.2f);
        const float n3 = anim_noise1(fi * 0.23f + gt * 0.13f);
        const float w = anim_wave(gt, 1.2f + base * 1.3f, 1.0f, fi * 0.33f);
        const float w2 = anim_wave(gt, 0.7f + base * 0.9f, 0.6f, fi * 0.77f);

        // Pointer proximity influence — stronger near cursor
        const float dx = (px01 - 0.5f);
        const float dy = (py01 - 0.5f);
        const float pointer_dist = sqrtf(dx * dx + dy * dy);
        const float pointer_proximity = clampf(1.0f - pointer_dist * 2.0f, 0.0f, 1.0f);

        const float amp = 1.0f + pointer_proximity * 0.5f;

        // Output params — richer motion
        const float tx = ((n - 0.5f) * 28.0f + w * 8.0f
                          + dx * (base - 0.5f) * 16.0f
                          + pointer_proximity * sinf(gt * 3.0f + fi) * 4.0f) * amp;
        const float ty = ((n2 - 0.5f) * 24.0f + sinf(gt * (0.7f + base)) * 7.0f
                          + (scroll01 - 0.5f) * (base - 0.5f) * 20.0f
                          + pointer_proximity * cosf(gt * 2.5f + fi) * 3.0f) * amp;
        const float rot = (w * 7.0f + (n - 0.5f) * 12.0f + w2 * 3.0f) * amp;
        const float sc = 1.0f + (n2 - 0.5f) * 0.07f + pointer_proximity * 0.02f;

        const float blur = clampf(fabsf(w) * 1.8f + fabsf(n - 0.5f) * 0.8f, 0.0f, 4.0f);
        const float hue = (base - 0.5f) * 80.0f + w * 22.0f + scroll01 * 15.0f;
        const float sat = clampf(1.0f + (n - 0.5f) * 0.7f, 0.65f, 1.6f);
        const float alpha = clampf(0.90f + (n2 - 0.5f) * 0.28f, 0.72f, 1.0f);

        // New channels
        const float glow = clampf(pointer_proximity * 0.6f + (n3 - 0.5f) * 0.3f + fabsf(w2) * 0.2f, 0.0f, 1.0f);
        const float skew = (w2 * 4.0f + (n - 0.5f) * 6.0f) * amp * 0.5f;

        const int o = i * DOMANIM_STRIDE;
        g_out[o + 0] = tx;
        g_out[o + 1] = ty;
        g_out[o + 2] = rot;
        g_out[o + 3] = sc;
        g_out[o + 4] = blur;
        g_out[o + 5] = hue;
        g_out[o + 6] = sat;
        g_out[o + 7] = alpha;
        g_out[o + 8] = glow;
        g_out[o + 9] = skew;
    }
}

int domanim_get_count(void) {
    return g_count;
}

int domanim_get_stride_floats(void) {
    return DOMANIM_STRIDE;
}

int domanim_get_ptr(void) {
    return (int)(uintptr_t)g_out;
}
