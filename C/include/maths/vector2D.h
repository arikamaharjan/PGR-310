#ifndef VECTOR2D_H
#define VECTOR2D_H
#include <stdint.h>
#include "entities/vector2Dentity.h"

// Add this conditional block
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#define EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define EXPORT
#endif

EXPORT vector2D vector2D_add(vector2D x, vector2D y);
EXPORT vector2D vector2D_sub(vector2D x, vector2D y);
EXPORT vector2D vector2D_scalar(vector2D v, float scalar);
EXPORT vector2D vector2D_lerp(vector2D a, vector2D b, float t);
EXPORT float vector2D_dot(vector2D a, vector2D b);
EXPORT float vector2D_magnitude(vector2D v);
EXPORT vector2D vector2D_normalize(vector2D v);

// Pointer-based variants (reduce struct copies)
EXPORT void vector2D_add_p(vector2D *out, const vector2D *a, const vector2D *b);
EXPORT void vector2D_sub_p(vector2D *out, const vector2D *a, const vector2D *b);
EXPORT void vector2D_scalar_p(vector2D *out, const vector2D *v, float s);
EXPORT void vector2D_normalize_p(vector2D *out, const vector2D *v);

// WASM-friendly wrappers (avoid struct return/args from JS)
EXPORT float vector2D_add_x(float ax, float ay, float bx, float by);
EXPORT float vector2D_add_y(float ax, float ay, float bx, float by);
EXPORT float vector2D_sub_x(float ax, float ay, float bx, float by);
EXPORT float vector2D_sub_y(float ax, float ay, float bx, float by);
EXPORT float vector2D_scalar_x(float x, float y, float scalar);
EXPORT float vector2D_scalar_y(float x, float y, float scalar);
EXPORT float vector2D_lerp_x(float ax, float ay, float bx, float by, float t);
EXPORT float vector2D_lerp_y(float ax, float ay, float bx, float by, float t);
EXPORT float vector2D_dot_xy(float ax, float ay, float bx, float by);
EXPORT float vector2D_magnitude_xy(float x, float y);
EXPORT vector2D vector2D_rotation(vector2D v, float angle);
EXPORT vector2D vector2D_rotaion(vector2D v, float angle);
EXPORT float vector2D_rotation_x(float x, float y, float angle);
EXPORT float vector2D_rotation_y(float x, float y, float angle);
EXPORT vector2D vector2D_wave(vector2D direction, vector2D wave, float amplitude, float frequency, float time, float phase);

// Interpolations
EXPORT vector2D vector2D_smoothstep(vector2D a, vector2D b, float t);
EXPORT vector2D vector2D_ease_in(vector2D a, vector2D b, float t);
EXPORT vector2D vector2D_ease_out(vector2D a, vector2D b, float t);
EXPORT float vector2D_smoothstep_x(float ax, float ay, float bx, float by, float t);
EXPORT float vector2D_smoothstep_y(float ax, float ay, float bx, float by, float t);
EXPORT float vector2D_ease_in_x(float ax, float ay, float bx, float by, float t);
EXPORT float vector2D_ease_in_y(float ax, float ay, float bx, float by, float t);
EXPORT float vector2D_ease_out_x(float ax, float ay, float bx, float by, float t);
EXPORT float vector2D_ease_out_y(float ax, float ay, float bx, float by, float t);

/* Simple WASM-driven animation API
	- set points to animate between
	- set duration
	- step advances internal time by dt seconds
	- get current x/y (interpolated using smoothstep)
*/
EXPORT void animation_set_points(float ax, float ay, float bx, float by);
EXPORT void animation_set_duration(float duration);
EXPORT void animation_step(float dt);
EXPORT float animation_get_x(void);
EXPORT float animation_get_y(void);
EXPORT void animation_reset(void);

/* Handle-based animation API (supports multiple concurrent animations)
	Returns a non-zero handle id on success, 0 if no slot available.
*/
EXPORT uint32_t animation_handle_create(float ax, float ay, float bx, float by, float duration);
EXPORT void animation_handle_step(uint32_t handleId, float dt);
EXPORT float animation_handle_get_x(uint32_t handleId);
EXPORT float animation_handle_get_y(uint32_t handleId);
EXPORT void animation_handle_reset(uint32_t handleId);
EXPORT void animation_handle_destroy(uint32_t handleId);
#endif