#ifndef SKELETON_MATHS_ENTITY_H
#define SKELETON_MATHS_ENTITY_H
#include <stdint.h>
#include "maths/vector2D.h"

typedef struct {
	vector2D position;
	float rotation; /* radians */
} skeleton_maths;

typedef struct {
	uint32_t bone_count;
	/* pointer to array of bone positions relative to skeleton origin */
	vector2D *bone_positions;
} skeleton_bones;

extern skeleton_maths default_skeleton;

#endif