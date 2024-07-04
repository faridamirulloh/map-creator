import { isEqual } from 'lodash';
import { calculateDistance2D, calculateDistance3D, doIntersect } from '../../libs/calcHelper';

export const isInvalidLine = (startPoint, endPoint, obstacles) => {
	let invalid = false;
	const p1 = {x: startPoint[0], y: startPoint[1]};
	const q1 = {x: endPoint[0], y: endPoint[1]};

	obstacles.forEach(({start, end}) => {
		const p2 = {x: start[0], y: start[start.length-1]};
		const q2 = {x: end[0], y: end[end.length-1]};
		if (doIntersect(p1, q1, p2, q2)) invalid = true;
	});

	return invalid;
};

const isDifferentLevel = (yA, yB) => yA !== yB;

const getNearestPathIndex = (paths = [], destination = [], stairs = []) => {
	let index = null;
	let nearestDistance = null;

	paths.forEach((path, i) => {
		const lastPoint = path[path.length - 1];
		let distance;

		if (isDifferentLevel(lastPoint.pos[1], destination[1])) {
			stairs.forEach((stair) => {
				distance = lastPoint.distance + stair.exit.distance
					+ calculateDistance2D(lastPoint.pos[0], lastPoint.pos[2], stair.entrance.point[0], stair.entrance.point[2]);

				if (nearestDistance === null || distance < nearestDistance) {
					index = i;
					nearestDistance = distance;
				}
			});
		} else {
			distance = lastPoint.distance + calculateDistance2D(lastPoint.pos[0], lastPoint.pos[2], destination[0], destination[2]);
		}

		if (nearestDistance === null || distance < nearestDistance) {
			index = i;
			nearestDistance = distance;
		}
	});

	return index;
};

const findNextPoints = (path, points, obsatcles) => {
	const nextPoints = [];
	const lastPoint = path[path.length - 1];

	points.forEach((_pos) => {
		if (
			!isDifferentLevel(lastPoint.pos[1], _pos[1])
			&& !isInvalidLine([lastPoint.pos[0], lastPoint.pos[2]], [_pos[0], _pos[2]], obsatcles.filter(({y}) => y === lastPoint.pos[1]))
			&& !path.find(({pos}) => isEqual(pos, _pos))
		) {
			nextPoints.push({ pos: _pos, distance: lastPoint.distance + calculateDistance2D(lastPoint.pos[0], lastPoint.pos[2], _pos[0], _pos[2]) });
		}
	});

	return nextPoints;
};

const doArrived = (paths, destination) => {
	let result;

	paths.forEach((path) => {
		const lastPoint = path[path.length - 1];

		if (isEqual(lastPoint.pos, destination)) result = path;
	});

	return result;
};

export const generatePath = (source = [], destination = [], points = [], obsatcles = [], stairsPoint = []) => {
	const availablePoints = [...points, destination, ...stairsPoint.flat()];
	const paths = [];
	const stairs = [];

	// init path, find possible paths
	availablePoints.forEach((pos) => {
		if (
			!isDifferentLevel(source[1], pos[1])
			&& !isInvalidLine([source[0], source[2]], [pos[0], pos[2]], obsatcles.filter(({y}) => y === source[1]))
			&& !isEqual(pos, source)
		) {
			paths.push([
				{ pos: source, distance: 0 },
				{ pos, distance: calculateDistance2D(source[0], source[2], pos[0], pos[2]) },
			]);
		}
	});

	if (isDifferentLevel(source[1], destination[1])) {
		stairsPoint.forEach((points) => {
			const entranceIndex = points.findIndex((point) => point[1] === source[1]);

			if (entranceIndex >= 0){
				const entrancePoint = points[entranceIndex];
				const exitPoint = points[entranceIndex ? 0 : 1];

				const stair = {
					entrance: {
						point: entrancePoint,
						distance: calculateDistance2D(source[0], source[2], entrancePoint[0], entrancePoint[2]),
					},
					exit: {
						point: exitPoint,
						distance: calculateDistance2D(destination[0], destination[2], exitPoint[0], exitPoint[2]),
					},
					lengthDistance: calculateDistance3D(entrancePoint, exitPoint),
				};

				stairs.push(stair);
			}
		});
	}

	while (!doArrived(paths, destination)) {
		if (paths.length === 0) throw 'No Path Available';
		const index = getNearestPathIndex(paths, destination, stairs);
		const lastPoint = paths[index][paths[index].length - 1];

		if (isDifferentLevel(lastPoint.pos[1], destination[1])) {
			stairs.forEach((stair) => {
				if (isEqual(stair.entrance.point, lastPoint.pos)) {
					paths[index].push({
						pos: stair.exit.point,
						distance: lastPoint.distance + stair.lengthDistance,
					});
				}
			});
		}

		const	nextPoints = findNextPoints(paths[index], availablePoints, obsatcles);

		if (nextPoints.length === 0) {
			paths.splice(index, 1);
		} else {
			const currentPath = [...paths[index]];

			nextPoints.forEach((point, i) => {
				if (i === 0) {
					paths[index].push(point);
				} else {
					paths.push([...currentPath, point]);
				}
			});
		}
	}

	return doArrived(paths, destination);
};
