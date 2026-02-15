cmake_minimum_required(VERSION 3.10)
project(Vector2D C)

# Set C standard
set(CMAKE_C_STANDARD 11)

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/include)

# Source files
set(SOURCES
    src/maths/vector2D.c
    src/algorithms/anim.c
)

# When building with Emscripten
if(EMSCRIPTEN)
    # WebAssembly build
    add_executable(vector2D ${SOURCES})
    
    set_target_properties(vector2D PROPERTIES
        SUFFIX ".js"
        LINK_FLAGS "-s WASM=1 -s EXPORTED_RUNTIME_METHODS='[\"ccall\",\"cwrap\"]' -s ALLOW_MEMORY_GROWTH=1 -O3 --no-entry"
    )
else()
    # Native build (for testing)
    add_library(vector2D STATIC ${SOURCES})
endif()