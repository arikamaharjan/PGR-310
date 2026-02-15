#include "maths/vector2D.h"

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
    return sqrtf(v.x * v.x + v.y * v.y);
}

#else

// Native x86 path: keep your SSE inline-asm exactly.

#include <stdint.h>

vector2D vector2D_add(vector2D x, vector2D y) {
    vector2D result;
    asm volatile(
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
    asm volatile(
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
    asm volatile(
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

    asm volatile(
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

    asm volatile(
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

//. vs ->
void animation_update(animationState anim, float deltatime){
    anim.time+=deltatime;// later can be changed into anim-> after using pointer and assigning heap memory
}