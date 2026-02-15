#ifndef DOM_ANIM_H
#define DOM_ANIM_H

#include "algorithms/anim.h"

#ifdef __cplusplus
extern "C" {
#endif

// Batch DOM animation driver.
// WASM computes per-element style parameters in one call per frame.

// Stride layout (floats):
// 0:tx(px), 1:ty(px), 2:rot(deg), 3:scale(unit), 4:blur(px),
// 5:hue(deg), 6:sat(unit), 7:alpha(unit), 8:glow(0-1), 9:skew(deg)

EXPORT void domanim_init(int count, int seed);
EXPORT void domanim_step(float t, float dt, float scroll01, float px01, float py01);

EXPORT int domanim_get_count(void);
EXPORT int domanim_get_stride_floats(void);
EXPORT int domanim_get_ptr(void);

#ifdef __cplusplus
}
#endif

#endif
