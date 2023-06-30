# three.js Frontend

This repository contains an HTML client based on [three.js](https://threejs.org) that connects to a CoppeliaSim add-on (the server) and displays the content of the simulation in real time.

To use it, enable the add-on in CoppeliaSim, then point a web-browser to `http://127.0.0.1:23020` (or replace `127.0.0.1` with machine's IP address, if CoppeliaSim is running on a different machine).

### Installation instructions:

```sh
$ git clone https://github.com/CoppeliaRobotics/threejsFrontend
$ cd threejsFrontend
$ mkdir -p build && cd build
$ cmake ..
$ cmake --build .
$ cmake --install .
```
