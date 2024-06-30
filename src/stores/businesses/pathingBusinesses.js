import { calculateDistance, doIntersect } from '../../libs/calcHelper';
import delay from '../../libs/delay';

export const isInvalidLine = (startPoint, endPoint, obstacles) => {
	let wrongPath = false;
	const p1 = {x: startPoint[0], y: startPoint[1]};
	const q1 = {x: endPoint[0], y: endPoint[1]};

	obstacles.forEach(({start, end}) => {
		const p2 = {x: start[0], y: start[1]};
		const q2 = {x: end[0], y: end[1]};
		if (doIntersect(p1, q1, p2, q2)) wrongPath = true;
	});

	return wrongPath;
};

const spreadPoints = [
	[-1, -1], [0, -1], [1, -1],
	[-1, 0], [1, 0],
	[-1, 1], [0, 1], [1, 1],
];

const pointToId = (point) => `x${point[0]}z${point[1]}`;

const getNextPoint = (currentPoint, destination, obsatcles, usedPoints, mapSize) => {
	let nearestPoint = null;
	let nearestDistance = null;

	spreadPoints.forEach(([x, z]) => {
		const nextPoint = [currentPoint.x + x, currentPoint.z + z];

		if (!usedPoints.includes(pointToId(nextPoint))
			&& !isInvalidLine([currentPoint.x, currentPoint.z], nextPoint, obsatcles)
			&& nextPoint[0] > 0 && nextPoint[1] > 0 && nextPoint[0] < mapSize.width && nextPoint[1] < mapSize.length
		) {

			const distance = currentPoint.distance + calculateDistance(nextPoint[0], nextPoint[1], destination[0], destination[1]);

			if (nearestDistance === null || nearestDistance > distance) {
				nearestDistance = distance;
				nearestPoint = nextPoint;
			}
		}
	});

	return {
		x: nearestPoint[0],
		z: nearestPoint[1],
		distance: currentPoint.distance + calculateDistance(currentPoint.x, currentPoint.z, nearestPoint[0], nearestPoint[1]),
	};
};

const getNearestPoint = (paths, destination) => {
	let nearestPoint = null;
	let nearestDistance = null;

	paths.forEach((path) => {
		const latestPoint = path[path.length -1];
		const distance = latestPoint.distance + calculateDistance(latestPoint.x, latestPoint.z, destination[0], destination[1]);

		if (nearestDistance === null || nearestDistance > distance) {
			nearestPoint = latestPoint;
			nearestDistance = distance;
		}
	});

	return nearestPoint;
};

export const generatePath = (source, destination, obsatcles, mapSize) => {
	const usedPoints = [pointToId(source)];
	let currentPoint = {
		x: source[0],
		z: source[1],
		distance: 0,
	};

	const isArrived = (x, z) => {
		return x === destination[0] && z === destination[1];
	};

	if (isArrived(currentPoint.x, currentPoint.z)) return null;

	const paths = spreadPoints.map((point) => (
		[
			{x: source[0], z: source[1], distance: 0},
			{x: source[0] + point[0], z: source[1] + point[1], distance: 1},
		]
	));
	let nextPoint = getNextPoint(currentPoint, destination, obsatcles, usedPoints, mapSize);
	currentPoint = nextPoint;
	let pathIndex;

	do {
		usedPoints.push(pointToId([currentPoint.x, currentPoint.z]));
		pathIndex =	paths.findIndex((path) => {
			const latestPoint = path[path.length - 1];
			return currentPoint.x === latestPoint.x && currentPoint.z === latestPoint.z;
		});
		nextPoint = getNextPoint(nextPoint, destination, obsatcles, usedPoints, mapSize);
		paths[pathIndex].push(nextPoint);
		currentPoint = getNearestPoint(paths, destination);
	} while (!isArrived(currentPoint.x, currentPoint.z));

	return paths[pathIndex];
};
