cmake_minimum_required(VERSION 3.12)
project(threejsFrontend)

if(NOT LIBPLUGIN_DIR)
    if(DEFINED ENV{COPPELIASIM_ROOT_DIR})
        set(LIBPLUGIN_DIR $ENV{COPPELIASIM_ROOT_DIR}/programming/libPlugin)
    else()
        set(LIBPLUGIN_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../libPlugin)
    endif()
endif()
set(CMAKE_MODULE_PATH
    ${CMAKE_MODULE_PATH}
    ${CMAKE_CURRENT_SOURCE_DIR}/cmake/modules
    ${LIBPLUGIN_DIR}/cmake)
find_package(CoppeliaSim 4.3.0.0 REQUIRED)

coppeliasim_add_addon(simAddOnVisualizationStream.lua)
coppeliasim_add_addon(threejsFrontend.html)
coppeliasim_add_addon(threejsFrontend.js)
coppeliasim_add_plugin_directory(3rdparty)
