#ifndef VECTOR2D_H
#define VECTOR2D_H
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
#endif