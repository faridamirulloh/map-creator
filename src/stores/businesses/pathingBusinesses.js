import { doIntersect } from '../../libs/calcHelper';

export const isWrongPath = (holdPos, hoverPos, obstacles) => {
	let wrongPath;

	const p1 = {x: holdPos[0], y: holdPos[2]};
	const q1 = {x: hoverPos[0], y: hoverPos[2]};
	obstacles.forEach(({start, end}) => {
		const p2 = {x: start[0], y: start[1]};
		const q2 = {x: end[0], y: end[1]};
		if (doIntersect(p1, q1, p2, q2)) wrongPath = true;
	});

	return wrongPath;
};
