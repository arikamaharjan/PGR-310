#include "maths/vector2D.h"
#include <stddef.h>
#include <math.h>

animationState anim={0.0f};
vector2D vector2D_lerp(vector2D a, vector2D b, float t) {
    vector2D result;
    result.x = a.x + (b.x - a.x) * t;
    result.y = a.y + (b.y - a.y) * t;
    return result;
}

float vector2D_dot(vector2D a, vector2D b) {
    return a.x * b.x + a.y * b.y;
}

#if defined(__EMSCRIPTEN__)

// WebAssembly target: x86 SSE inline-asm cannot compile here.

vector2D vector2D_add(vector2D a, vector2D b) {
    vector2D result;
    result.x = a.x + b.x;
    result.y = a.y + b.y;
    return result;
}

vector2D vector2D_sub(vector2D a, vector2D b) {
    vector2D result;
    result.x = a.x - b.x;
    result.y = a.y - b.y;
    return result;
}

vector2D vector2D_scalar(vector2D v, float scalar) {
    vector2D result;
    result.x = v.x * scalar;
    result.y = v.y * scalar;
    return result;
}

float vector2D_magnitude(vector2D v) {
    /* Alpha-Beta magnitude approximation (fast, good enough for animations)
       magnitude ≈ alpha * max(|x|,|y|) + beta * min(|x|,|y|)
       avoids expensive sqrt on WASM targets. */
    const float ax = v.x < 0.0f ? -v.x : v.x;
    const float ay = v.y < 0.0f ? -v.y : v.y;
    const float max = ax > ay ? ax : ay;
    const float min = ax > ay ? ay : ax;
    const float alpha = 0.936f;
    const float beta = 0.398f;
    return max * alpha + min * beta;
}

vector2D vector2D_normalize(vector2D v) {
    vector2D result = {0.0f, 0.0f};
    const float mag = vector2D_magnitude(v);
    if (mag > 1e-6f) {
        const float inv = 1.0f / mag;
        result.x = v.x * inv;
        result.y = v.y * inv;
    }
    return result;
}

// Pointer-based variants
void vector2D_add_p(vector2D *out, const vector2D *a, const vector2D *b) {
    if (!out || !a || !b) return;
    out->x = a->x + b->x;
    out->y = a->y + b->y;
}

void vector2D_sub_p(vector2D *out, const vector2D *a, const vector2D *b) {
    if (!out || !a || !b) return;
    out->x = a->x - b->x;
    out->y = a->y - b->y;
}

void vector2D_scalar_p(vector2D *out, const vector2D *v, float s) {
    if (!out || !v) return;
    out->x = v->x * s;
    out->y = v->y * s;
}

void vector2D_normalize_p(vector2D *out, const vector2D *v) {
    if (!out || !v) return;
    const float mag = vector2D_magnitude(*v);
    if (mag > 1e-6f) {
        const float inv = 1.0f / mag;
        out->x = v->x * inv;
        out->y = v->y * inv;
    } else {
        out->x = 0.0f;
        out->y = 0.0f;
    }
}

#else

// Native x86 path: keep your SSE inline-asm exactly.

#include <stdint.h>

vector2D vector2D_add(vector2D x, vector2D y) {
    vector2D result;
    __asm__ volatile(
        "movq %1,%%xmm0\n\t" //load x into xmm0
        "movq %2, %%xmm1\n\t" //load y into xmm1
        "addps %%xmm1,%%xmm0\n\t" //basically doing add(a,b)
        "movq %%xmm0, %0\n\t" // store result
        : "=m"(result)
        : "m"(x), "m"(y)
        : "%xmm0", "%xmm1"
    );
    return result;
}

vector2D vector2D_sub(vector2D x, vector2D y) {
    vector2D result;
    __asm__ volatile(
        "movq %1, %%xmm0\n\t" //load x into xmm0 register
        "movq %2, %%xmm1\n\t" //load y into xmm1 register
        "subps %%xmm1,%%xmm0\n\t" //basically doing sub(a,b)
        "movq %%xmm0, %0\n\t" //storing result in xmm0
        : "=m"(result)
        : "m"(x), "m"(y)
        : "%xmm0", "%xmm1"
    );
    return result;
}

vector2D vector2D_scalar(vector2D v, float scalar) {
    vector2D result;
    __asm__ volatile(
        "movq %1, %%xmm0\n\t"// loaded x&y into xmm0 registers
        "movss %2, %%xmm1\n\t"//loaded scale into xmm1 since its float we assign it 32-bits meaning ss
        "shufps $0, %%xmm1, %%xmm1\n\t" //broadcast to all slots
        "mulps %%xmm1,%%xmm0\n\t"//multiply
        "movq %%xmm0, %0\n\t"//store result in xmm0
        : "=m"(result)
        : "m"(v), "m"(scalar)
        : "%xmm0", "%xmm1"
    );
    return result;
}

float vector2D_magnitude(vector2D v) {
    float result;
    const float alpha = 0.936f;
    const float beta = 0.398f;
    // Keep it 4 elements long for andps safety!
    uint32_t mask[4] __attribute__((aligned(16))) = {0x7FFFFFFF, 0x7FFFFFFF, 0x7FFFFFFF, 0x7FFFFFFF};

    __asm__ volatile(
        "movq %1, %%xmm0\n\t"           // Load [y, x] in one shot
        "andps %2, %%xmm0\n\t"          // Abs both: [|y|, |x|]

        "movaps %%xmm0, %%xmm1\n\t"
        "shufps $0x01, %%xmm1, %%xmm1\n\t" // Swap: xmm1 low is |y|

        "movaps %%xmm0, %%xmm2\n\t"     // Copy |x| to xmm2
        "maxss %%xmm1, %%xmm0\n\t"      // xmm0 = max(|x|, |y|)
        "minss %%xmm1, %%xmm2\n\t"      // xmm2 = min(|x|, |y|)

        "mulss %3, %%xmm0\n\t"          // max * alpha
        "mulss %4, %%xmm2\n\t"          // min * beta
        "addss %%xmm2, %%xmm0\n\t"      // Final sum

        "movss %%xmm0, %0\n\t"          // Store result
        : "=m"(result)
        : "m"(v), "m"(mask), "m"(alpha), "m"(beta)
        : "xmm0", "xmm1", "xmm2"
    );

    return result;
}

vector2D vector2D_normalize(vector2D v) {
    vector2D result;
    const float alpha = 0.936f;
    const float beta = 0.398f;
    uint32_t mask[4] __attribute__((aligned(16))) = {0x7FFFFFFF, 0x7FFFFFFF, 0x7FFFFFFF, 0x7FFFFFFF};

    __asm__ volatile(
        // --- 1. Calculate Magnitude (Alpha-Beta approximation) ---
        "movq %1, %%xmm0\n\t"           // xmm0 = [y, x]
        "andps %2, %%xmm0\n\t"          // [|y|, |x|]
        "movaps %%xmm0, %%xmm1\n\t"
        "shufps $0x01, %%xmm1, %%xmm1\n\t"
        "movaps %%xmm0, %%xmm2\n\t"
        "maxss %%xmm1, %%xmm0\n\t"      // xmm0 = max
        "minss %%xmm1, %%xmm2\n\t"      // xmm2 = min
        "mulss %3, %%xmm0\n\t"          // max * alpha
        "mulss %4, %%xmm2\n\t"          // min * beta
        "addss %%xmm2, %%xmm0\n\t"      // xmm0 = magnitude

        // --- 2. Fast reciprocal (1.0 / magnitude) ---
        "rcpss %%xmm0, %%xmm0\n\t"      // xmm0 ≈ 1/mag (fast!)

        // --- 3. Scale the original vector ---
        "shufps $0, %%xmm0, %%xmm0\n\t" // Broadcast (1/mag)
        "movq %1, %%xmm1\n\t"           // Load original [y, x]
        "mulps %%xmm0, %%xmm1\n\t"      // [y, x] * (1/mag)

        "movq %%xmm1, %0\n\t"           // Store result
        : "=m"(result)
        : "m"(v), "m"(mask), "m"(alpha), "m"(beta)
        : "%xmm0", "%xmm1", "%xmm2"
    );
    return result;
}

#endif
// Provide pointer-based variants for native builds when not compiling with Emscripten
#ifndef __EMSCRIPTEN__
// Pointer-based variants (non-WASM/native implementations)
void vector2D_add_p(vector2D *out, const vector2D *a, const vector2D *b) {
    if (!out || !a || !b) return;
    out->x = a->x + b->x;
    out->y = a->y + b->y;
}

void vector2D_sub_p(vector2D *out, const vector2D *a, const vector2D *b) {
    if (!out || !a || !b) return;
    out->x = a->x - b->x;
    out->y = a->y - b->y;
}

void vector2D_scalar_p(vector2D *out, const vector2D *v, float s) {
    if (!out || !v) return;
    out->x = v->x * s;
    out->y = v->y * s;
}

void vector2D_normalize_p(vector2D *out, const vector2D *v) {
    if (!out || !v) return;
    const float mag = vector2D_magnitude(*v);
    if (mag > 1e-6f) {
        const float inv = 1.0f / mag;
        out->x = v->x * inv;
        out->y = v->y * inv;
    } else {
        out->x = 0.0f;
        out->y = 0.0f;
    }
}
#endif

// WASM-friendly wrappers (avoid struct passing/return across the JS boundary)
float vector2D_add_x(float ax, float ay, float bx, float by) {
    (void)ay;
    (void)by;
    return ax + bx;
}

// --- Interpolation helpers ---
static inline float lerp(float a, float b, float t) {
    return a + (b - a) * t;
}

static inline float smoothstep(float a, float b, float t) {
    t = t < 0.f ? 0.f : t > 1.f ? 1.f : t;
    t = t * t * (3.f - 2.f * t);
    return a + (b - a) * t;
}

static inline float ease_in(float a, float b, float t) {
    t = t < 0.f ? 0.f : t > 1.f ? 1.f : t;
    t = t * t;
    return a + (b - a) * t;
}

static inline float ease_out(float a, float b, float t) {
    t = t < 0.f ? 0.f : t > 1.f ? 1.f : t;
    t = 1.f - (1.f - t) * (1.f - t);
    return a + (b - a) * t;
}

static inline float cubic_interp(float a, float b, float c, float d, float t) {
    // Catmull-Rom spline
    float t2 = t * t;
    float t3 = t2 * t;
    return 0.5f * ((2.f * b) + (-a + c) * t + (2.f * a - 5.f * b + 4.f * c - d) * t2 + (-a + 3.f * b - 3.f * c + d) * t3);
}

vector2D vector2D_smoothstep(vector2D a, vector2D b, float t) {
    vector2D result;
    result.x = smoothstep(a.x, b.x, t);
    result.y = smoothstep(a.y, b.y, t);
    return result;
}

vector2D vector2D_ease_in(vector2D a, vector2D b, float t) {
    vector2D result;
    result.x = ease_in(a.x, b.x, t);
    result.y = ease_in(a.y, b.y, t);
    return result;
}

vector2D vector2D_ease_out(vector2D a, vector2D b, float t) {
    vector2D result;
    result.x = ease_out(a.x, b.x, t);
    result.y = ease_out(a.y, b.y, t);
    return result;
}

// WASM-friendly wrappers for interpolations
float vector2D_smoothstep_x(float ax, float ay, float bx, float by, float t) {
    (void)ay; (void)by;
    return smoothstep(ax, bx, t);
}
float vector2D_smoothstep_y(float ax, float ay, float bx, float by, float t) {
    (void)ax; (void)bx;
    return smoothstep(ay, by, t);
}
float vector2D_ease_in_x(float ax, float ay, float bx, float by, float t) {
    (void)ay; (void)by;
    return ease_in(ax, bx, t);
}
float vector2D_ease_in_y(float ax, float ay, float bx, float by, float t) {
    (void)ax; (void)bx;
    return ease_in(ay, by, t);
}
float vector2D_ease_out_x(float ax, float ay, float bx, float by, float t) {
    (void)ay; (void)by;
    return ease_out(ax, bx, t);
}
float vector2D_ease_out_y(float ax, float ay, float bx, float by, float t) {
    (void)ax; (void)bx;
    return ease_out(ay, by, t);
}

float vector2D_add_y(float ax, float ay, float bx, float by) {
    (void)ax;
    (void)bx;
    return ay + by;
}

float vector2D_sub_x(float ax, float ay, float bx, float by) {
    (void)ay;
    (void)by;
    return ax - bx;
}

float vector2D_sub_y(float ax, float ay, float bx, float by) {
    (void)ax;
    (void)bx;
    return ay - by;
}

float vector2D_scalar_x(float x, float y, float scalar) {
    (void)y;
    return x * scalar;
}

float vector2D_scalar_y(float x, float y, float scalar) {
    (void)x;
    return y * scalar;
}

float vector2D_lerp_x(float ax, float ay, float bx, float by, float t) {
    (void)ay;
    (void)by;
    return ax + (bx - ax) * t;
}

float vector2D_lerp_y(float ax, float ay, float bx, float by, float t) {
    (void)ax;
    (void)bx;
    return ay + (by - ay) * t;
}

float vector2D_dot_xy(float ax, float ay, float bx, float by) {
    return ax * bx + ay * by;
}

float vector2D_magnitude_xy(float x, float y) {
    return sqrtf(x * x + y * y);
}

vector2D vector2D_rotation(vector2D v, float angle) {
    const float cos_a = cosf(angle);
    const float sin_a = sinf(angle);

    const vector2D cos_part = vector2D_scalar(v, cos_a);
    const vector2D sin_part = vector2D_scalar((vector2D){-v.y, v.x}, sin_a);
    return vector2D_add(cos_part, sin_part);
}

// Backward-compat: original misspelled name.
vector2D vector2D_rotaion(vector2D v, float angle) {
    return vector2D_rotation(v, angle);
}

// WASM-friendly rotation wrappers
float vector2D_rotation_x(float x, float y, float angle) {
    const float cos_a = cosf(angle);
    const float sin_a = sinf(angle);
    return x * cos_a - y * sin_a;
}

float vector2D_rotation_y(float x, float y, float angle) {
    const float cos_a = cosf(angle);
    const float sin_a = sinf(angle);
    return x * sin_a + y * cos_a;
}
static inline float oscillate(float amplitude,float frequency, float time,float phase){
    return amplitude*sinf(frequency*time+phase);
}
vector2D vector2D_wave(vector2D direction, vector2D base, float amplitude, float frequency, float time, float phase){
    float wave=oscillate(amplitude,frequency,time,phase);
    vector2D offset=vector2D_scalar(direction,wave);
    return vector2D_add(base,offset);
}

// Simple module-level animation state for WASM-driven animations
static float wasm_anim_start_x = 0.0f;
static float wasm_anim_start_y = 0.0f;
static float wasm_anim_end_x = 0.0f;
static float wasm_anim_end_y = 0.0f;
static float wasm_anim_time = 0.0f;
static float wasm_anim_duration = 1.0f;
static int wasm_anim_running = 0;

EXPORT void animation_set_points(float ax, float ay, float bx, float by){
    wasm_anim_start_x = ax;
    wasm_anim_start_y = ay;
    wasm_anim_end_x = bx;
    wasm_anim_end_y = by;
    wasm_anim_time = 0.0f;
    wasm_anim_running = 1;
}

EXPORT void animation_set_duration(float duration){
    if(duration > 0.0f) wasm_anim_duration = duration;
}

EXPORT void animation_step(float dt){
    if(!wasm_anim_running) return;
    wasm_anim_time += dt;
    if(wasm_anim_time >= wasm_anim_duration){
        wasm_anim_time = wasm_anim_duration;
        wasm_anim_running = 0; // stop at end
    }
}

EXPORT float animation_get_x(void){
    float t = (wasm_anim_duration > 0.0f) ? (wasm_anim_time / wasm_anim_duration) : 1.0f;
    return smoothstep(wasm_anim_start_x, wasm_anim_end_x, t);
}

EXPORT float animation_get_y(void){
    float t = (wasm_anim_duration > 0.0f) ? (wasm_anim_time / wasm_anim_duration) : 1.0f;
    return smoothstep(wasm_anim_start_y, wasm_anim_end_y, t);
}

EXPORT void animation_reset(void){
    wasm_anim_time = 0.0f;
    wasm_anim_running = 0;
}

/* Handle-based animations */
#define ANIM_MAX_HANDLES 256
typedef struct {
    float sx, sy, ex, ey;
    float time;
    float duration;
    int active;
} anim_handle_t;

static anim_handle_t anim_handles[ANIM_MAX_HANDLES];

static inline uint32_t alloc_handle(void){
    for(uint32_t i=0;i<ANIM_MAX_HANDLES;i++){
        if(!anim_handles[i].active){
            anim_handles[i].active = 1;
            anim_handles[i].time = 0.0f;
            anim_handles[i].duration = 1.0f;
            return i + 1; // non-zero handle
        }
    }
    return 0;
}

static inline anim_handle_t* get_handle_ptr(uint32_t id){
    if(id == 0) return NULL;
    uint32_t idx = id - 1;
    if(idx >= ANIM_MAX_HANDLES) return NULL;
    if(!anim_handles[idx].active) return NULL;
    return &anim_handles[idx];
}

EXPORT uint32_t animation_handle_create(float ax, float ay, float bx, float by, float duration){
    uint32_t h = alloc_handle();
    if(h == 0) return 0;
    anim_handle_t *p = &anim_handles[h-1];
    p->sx = ax; p->sy = ay; p->ex = bx; p->ey = by;
    p->time = 0.0f;
    p->duration = duration > 0.0f ? duration : 1.0f;
    p->active = 1;
    return h;
}

EXPORT void animation_handle_step(uint32_t handleId, float dt){
    anim_handle_t *p = get_handle_ptr(handleId);
    if(!p) return;
    p->time += dt;
    if(p->time >= p->duration) p->time = p->duration;
}

EXPORT float animation_handle_get_x(uint32_t handleId){
    anim_handle_t *p = get_handle_ptr(handleId);
    if(!p) return 0.0f;
    float t = (p->duration > 0.0f) ? (p->time / p->duration) : 1.0f;
    return smoothstep(p->sx, p->ex, t);
}

EXPORT float animation_handle_get_y(uint32_t handleId){
    anim_handle_t *p = get_handle_ptr(handleId);
    if(!p) return 0.0f;
    float t = (p->duration > 0.0f) ? (p->time / p->duration) : 1.0f;
    return smoothstep(p->sy, p->ey, t);
}

EXPORT void animation_handle_reset(uint32_t handleId){
    anim_handle_t *p = get_handle_ptr(handleId);
    if(!p) return;
    p->time = 0.0f;
}

EXPORT void animation_handle_destroy(uint32_t handleId){
    if(handleId == 0) return;
    uint32_t idx = handleId - 1;
    if(idx >= ANIM_MAX_HANDLES) return;
    anim_handles[idx].active = 0;
}