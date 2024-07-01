import { isEqual } from 'lodash';
import { calculateDistance, doIntersect } from '../../libs/calcHelper';

export const isInvalidLine = (startPoint, endPoint, obstacles) => {
	let invalid = false;
	const p1 = {x: startPoint[0], y: startPoint[1]};
	const q1 = {x: endPoint[0], y: endPoint[1]};

	obstacles.forEach(({start, end}) => {
		const p2 = {x: start[0], y: start[1]};
		const q2 = {x: end[0], y: end[1]};
		if (doIntersect(p1, q1, p2, q2)) invalid = true;
	});

	return invalid;
};

const pointToId = (point) => `x${point[0]}z${point[1]}`;

const getNearestPathIndex = (paths, destination) => {
	let index = null;
	let nearestDistance = null;

	paths.forEach((path, i) => {
		const latestPoint = path[path.length - 1];
		const distance = latestPoint.distance + calculateDistance(latestPoint.pos[0], latestPoint.pos[2], destination[0], destination[2]);

		if (nearestDistance === null || nearestDistance > distance) {
			index = i;
			nearestDistance = distance;
		}
	});

	return index;
};

const getNextPoints = (path, points, obsatcles) => {
	const nextPoints = [];
	const latestPoint = path[path.length - 1];

	points.forEach((_pos) => {
		if (!isInvalidLine([latestPoint.pos[0], latestPoint.pos[2]], [_pos[0], _pos[2]], obsatcles)
		&& !path.find(({pos}) => isEqual(pos, _pos))
		) {
			nextPoints.push({ pos: _pos, distance: latestPoint.distance + calculateDistance(latestPoint.pos[0], latestPoint.pos[2], _pos[0], _pos[2]) });
		}
	});

	return nextPoints;
};

export const generatePath = (source, destination, points, obsatcles) => {
	const paths = [];
	let currentPoint = {
		pos: source,
		distance: 0,
	};

	const getFinalPath = (paths) => {
		let result;

		paths.forEach((path) => {
			const latestPoint = path[path.length - 1];

			if (isEqual(latestPoint.pos, destination)) result = path;
		});

		return result;
	};

	points.forEach((pos) => {
		if (!isInvalidLine([source[0], source[2]], [pos[0], pos[2]], obsatcles)
		&& !isEqual(pos, source)
		) {
			paths.push([
				currentPoint,
				{ pos, distance: calculateDistance(source[0], source[2], pos[0], pos[2]) },
			]);
		}
	});

	while (!getFinalPath(paths)) {
		const index = getNearestPathIndex(paths, destination);
		const nextPoints = getNextPoints(paths[index], points, obsatcles);

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

				if (isEqual(point.pos, destination)) {
					currentPoint = point;
				}
			});
		}
	}

	return getFinalPath(paths);
};
