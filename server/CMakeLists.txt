cmake_minimum_required(VERSION 3.15)
cmake_policy(SET CMP0091 NEW)
cmake_policy(SET CMP0042 NEW)

project (server)

add_definitions(-DNAPI_VERSION=4)

include_directories(${CMAKE_JS_INC})
include_directories(${CMAKE_SOURCE_DIR}/node_modules/node-addon-api)

if (UNIX AND APPLE)
    message(STATUS "macOS build")
    list(APPEND LIBS "-framework ApplicationServices" "-framework Cocoa")
elseif (WIN32)
    message(STATUS "Windows build")
elseif (UNIX AND NOT APPLE)
    message(STATUS "Linux build")
    list(APPEND LIBS "-lX11" "-lXtst" "-lXext")
endif()

if(WIN32)
    file(GLOB_RECURSE HEADERS "${CMAKE_SOURCE_DIR}/src/native/win32/headers/**.h")
    file(GLOB_RECURSE SOURCES "${CMAKE_SOURCE_DIR}/src/native/win32/**.cc")
    set(SOURCE_FILES ${SOURCES} ${HEADERS})
elseif (UNIX AND NOT APPLE)
    file(GLOB_RECURSE HEADERS "${CMAKE_SOURCE_DIR}/src/native/linux/headers/**.h")
    file(GLOB_RECURSE SOURCES "${CMAKE_SOURCE_DIR}/src/native/linux/**.cc")
    set(SOURCE_FILES ${SOURCES} ${HEADERS})
    find_package(X11 REQUIRED)
    find_library(X11_XTEST_LIBRARY Xtst REQUIRED)
    find_package(PkgConfig REQUIRED)
    pkg_check_modules(XCB REQUIRED xcb xcb-ewmh)
    include_directories(${X11_INCLUDE_DIR} ${XCB_INCLUDE_DIRS})
elseif (UNIX AND APPLE)
    message(FATAL_ERROR "Unsupported OS")
else()
    message(FATAL_ERROR "Unsupported OS")
endif()


add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

if(WIN32)
    target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})
elseif(UNIX)
    target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} ${X11_LIBRARIES} ${XCB_LIBRARIES} ${X11_XTEST_LIBRARY})
endif()

if(MSVC AND CMAKE_JS_NODELIB_DEF AND CMAKE_JS_NODELIB_TARGET)
  # Generate node.lib
  execute_process(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})
endif()
