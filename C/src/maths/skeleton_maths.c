#include "maths/skeleton_maths.h"
#include "maths/vector2D.h"
#include <stddef.h>
#include <stdint.h>
#include <math.h>

/* Default instance (extern in entity header) */
skeleton_maths default_skeleton = {{0.0f, 0.0f}, 0.0f};

EXPORT void skeleton_init(skeleton_maths *s, float x, float y, float rot){
	if(!s) return;
	s->position.x = x;
	s->position.y = y;
	s->rotation = rot;
}

EXPORT void skeleton_translate(skeleton_maths *s, float dx, float dy){
	if(!s) return;
	vector2D offset = {dx, dy};
	s->position = vector2D_add(s->position, offset);
}

EXPORT void skeleton_rotate(skeleton_maths *s, float rot){
	if(!s) return;
	s->rotation += rot;
}

EXPORT float skeleton_get_x(const skeleton_maths *s){
	return s ? s->position.x : 0.0f;
}

EXPORT float skeleton_get_y(const skeleton_maths *s){
	return s ? s->position.y : 0.0f;
}

EXPORT float skeleton_get_rotation(const skeleton_maths *s){
	return s ? s->rotation : 0.0f;
}

/* ------------------ Additional fast/math helpers ------------------ */

/* Fixed-point smoothing */
#define FIXED_SHIFT 10  /* 1024 = 1.0 */
#define FIXED_ONE (1 << FIXED_SHIFT)

typedef struct {
	int32_t x;  /* Fixed-point: actual_value * 1024 */
	int32_t y;
} fixed_position;

typedef struct {
	fixed_position position;
	int32_t rotation;  /* Fixed-point angle */
} skeleton_fixed;

EXPORT void skeleton_smooth_fixed(skeleton_fixed *s, int32_t target_x, int32_t target_y, uint32_t alpha) {
	if(!s) return;
	/* alpha is 0-1024 (representing 0.0 to 1.0) */
	s->position.x += ((target_x - s->position.x) * (int32_t)alpha) >> FIXED_SHIFT;
	s->position.y += ((target_y - s->position.y) * (int32_t)alpha) >> FIXED_SHIFT;
}

/* Convert to/from float when needed */
static inline int32_t float_to_fixed(float f) {
	return (int32_t)(f * FIXED_ONE);
}

static inline float fixed_to_float(int32_t f) {
	return (float)f / FIXED_ONE;
}

/* Fast sin/cos approximation (Bhaskara I + polishing) */
static inline float fast_sin(float x) {
	/* Normalize x to [-PI, PI] */
	while(x > 3.14159265f) x -= 6.28318530f;
	while(x < -3.14159265f) x += 6.28318530f;
	const float B = 4.0f / 3.14159265f;
	const float C = -4.0f / (3.14159265f * 3.14159265f);
	float ax = x < 0.0f ? -x : x;
	float y = B * x + C * x * ax;
	/* Optional: extra precision */
	const float P = 0.225f;
	float ay = y < 0.0f ? -y : y;
	y = P * (y * ay - y) + y;
	return y;
}

static inline float fast_cos(float x) {
	return fast_sin(x + 1.57079632f);  /* PI/2 */
}

EXPORT void skeleton_move_forward_fast(skeleton_maths *s, float distance) {
	if(!s) return;
	s->position.x += fast_cos(s->rotation) * distance;
	s->position.y += fast_sin(s->rotation) * distance;
}

/* Lookup table (LUT) for trig */
#define LUT_SIZE 256U
static float sin_lut[LUT_SIZE];
static float cos_lut[LUT_SIZE];
static uint32_t lut_initialized = 0;

EXPORT void skeleton_init_lut(void) {
	if(lut_initialized) return;
	for(uint32_t i = 0; i < LUT_SIZE; i++) {
		float angle = (float)i * 6.28318530f / (float)LUT_SIZE;  /* 2*PI */
		sin_lut[i] = sinf(angle);
		cos_lut[i] = cosf(angle);
	}
	lut_initialized = 1;
}

static inline float lut_sin(float angle) {
	/* Normalize to 0-2PI */
	while(angle < 0) angle += 6.28318530f;
	while(angle >= 6.28318530f) angle -= 6.28318530f;
	uint32_t index = (uint32_t)(angle * (float)LUT_SIZE / 6.28318530f) % LUT_SIZE;
	return sin_lut[index];
}

static inline float lut_cos(float angle) {
	while(angle < 0) angle += 6.28318530f;
	while(angle >= 6.28318530f) angle -= 6.28318530f;
	uint32_t index = (uint32_t)(angle * (float)LUT_SIZE / 6.28318530f) % LUT_SIZE;
	return cos_lut[index];
}

EXPORT void skeleton_move_forward_lut(skeleton_maths *s, float distance) {
	if(!s) return;
	if(!lut_initialized) skeleton_init_lut();
	s->position.x += lut_cos(s->rotation) * distance;
	s->position.y += lut_sin(s->rotation) * distance;
}

/* Adaptive threshold snapping */
EXPORT void skeleton_smooth_adaptive(skeleton_maths *s, float target_x, float target_y,
									 float smoothness, float snap_threshold) {
	if(!s) return;
	float dx = target_x - s->position.x;
	float dy = target_y - s->position.y;
	/* Fast distance check (avoid sqrt) */
	float dist_sq = dx * dx + dy * dy;
	if(dist_sq < snap_threshold * snap_threshold) {
		/* Close enough - snap directly */
		s->position.x = target_x;
		s->position.y = target_y;
	} else {
		/* Smooth approach */
		s->position.x += dx * smoothness;
		s->position.y += dy * smoothness;
	}
}

/* Integer-only 8-direction movement (grid-friendly) */
typedef enum {
	DIR_E = 0,   /* 0° */
	DIR_SE = 1,  /* 45° */
	DIR_S = 2,   /* 90° */
	DIR_SW = 3,  /* 135° */
	DIR_W = 4,   /* 180° */
	DIR_NW = 5,  /* 225° */
	DIR_N = 6,   /* 270° */
	DIR_NE = 7   /* 315° */
} direction_8;

static const int dir_dx[8] = { 1,  1,  0, -1, -1, -1,  0,  1};
static const int dir_dy[8] = { 0,  1,  1,  1,  0, -1, -1, -1};

EXPORT void skeleton_move_direction(skeleton_maths *s, direction_8 dir, float distance) {
	if(!s) return;
	uint32_t udir = (uint32_t)dir;
	if(udir >= 8) return;
	s->position.x += (float)dir_dx[udir] * distance;
	s->position.y += (float)dir_dy[udir] * distance;
}
