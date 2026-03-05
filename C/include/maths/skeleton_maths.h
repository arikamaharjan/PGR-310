#ifndef SKELETON_MATHS_H
#define SKELETON_MATHS_H
#include "entities/skeleton_maths_entity.h"

// EXPORT macro (WASM-friendly)
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#define EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define EXPORT
#endif

EXPORT void skeleton_init(skeleton_maths *s, float x, float y, float rot);
EXPORT void skeleton_translate(skeleton_maths *s, float dx, float dy);
EXPORT void skeleton_rotate(skeleton_maths *s, float rot);
EXPORT float skeleton_get_x(const skeleton_maths *s);
EXPORT float skeleton_get_y(const skeleton_maths *s);
EXPORT float skeleton_get_rotation(const skeleton_maths *s);

#endif
