# Map Generator And Path Finder

Prerequisite:
- Node version 20.11^
- Yarn version 1.22^

How to run:
  - run 'yarn' // to install the packages
  - run 'yarn dev' // to run development program

You can view this app here:
- [Map Generator And Path Finder](https://my-app-123321.web.app/)

How the pathfinder in this app works:

  It identifies all available nodes (waypoints) and measures the distance from the source to the destination, then compares these distances with other available paths to find the shortest route. It continues searching for nodes closest to the destination until it reaches the destination node.