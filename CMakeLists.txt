cmake_minimum_required(VERSION 3.15)
cmake_policy(SET CMP0091 NEW)
cmake_policy(SET CMP0042 NEW)

project (native)

add_definitions(-DNAPI_VERSION=4)

include_directories(${CMAKE_JS_INC})


if(WIN32)
    message(STATUS "Windows build")
    file(GLOB_RECURSE HEADERS "${CMAKE_SOURCE_DIR}/src/native/win32/headers/**.h")
    file(GLOB_RECURSE SOURCES "${CMAKE_SOURCE_DIR}/src/native/win32/**.cc")
    set(SOURCE_FILES ${SOURCES} ${HEADERS})
elseif (UNIX AND NOT APPLE)
    message(STATUS "Linux build")
    # libXtst - allows sending keyStores at global level on X11 with XTestFakeKeyEvent
    # libX11 - allows X11 window manipulation, mouse, displays etc
    list(APPEND LIBS "-lX11" "-lXtst")
    file(GLOB_RECURSE HEADERS "${CMAKE_SOURCE_DIR}/src/native/linux/headers/**.h")
    file(GLOB_RECURSE SOURCES "${CMAKE_SOURCE_DIR}/src/native/linux/**.cc")
    set(SOURCE_FILES ${SOURCES} ${HEADERS})
    find_package(X11 REQUIRED)
    find_library(X11_XTEST_LIBRARY Xtst REQUIRED)
    find_package(PkgConfig REQUIRED)
    pkg_check_modules(XCB REQUIRED xcb xcb-ewmh)
    include_directories(${X11_INCLUDE_DIR} ${XCB_INCLUDE_DIRS})
elseif (UNIX AND APPLE)
    message(STATUS "macOS build")
    list(APPEND LIBS "-framework ApplicationServices" "-framework Cocoa")
    file(GLOB_RECURSE HEADERS "${CMAKE_SOURCE_DIR}/src/native/darwin/headers/**.h")
    file(GLOB_RECURSE SOURCES "${CMAKE_SOURCE_DIR}/src/native/darwin/**.cc")
    set(SOURCE_FILES ${SOURCES} ${HEADERS})
    set(CMAKE_CXX_STANDARD 17)
    set(CMAKE_CXX_STANDARD_REQUIRED ON)
    set(CMAKE_CXX_EXTENSIONS OFF)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-deprecated-declarations -x objective-c++")
endif()


add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

if(WIN32)
    target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})
elseif(UNIX AND NOT APPLE)
    target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} ${X11_LIBRARIES} ${XCB_LIBRARIES} ${X11_XTEST_LIBRARY})
elseif(UNIX AND APPLE)
    target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} "-framework ApplicationServices" "-framework Cocoa" "-framework AppKit")
endif ()

if(MSVC AND CMAKE_JS_NODELIB_DEF AND CMAKE_JS_NODELIB_TARGET)
  # Generate node.lib
  execute_process(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})
endif()
