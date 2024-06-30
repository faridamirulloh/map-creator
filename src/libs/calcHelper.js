import { Vector3 } from 'three';

export const calculateDistance = (xA, yA, xB, yB) => {
	const distance = Math.sqrt((Math.pow(xA-xB, 2) + Math.pow(yA-yB, 2)));
	return distance;
};

export const calculateAngleRad = (xA, yA, xB, yB) => {
	const angle = Math.atan2(yB - yA, xB - xA);
	return -angle;
};

export const calculatePosition = (xA, yA, zA, xB, yB, zB) => {
	const position = new Vector3(xA + (xB - xA)/2, yA + (yB - yA)/2, zA + (zB - zA)/2);
	return position;
};

// To find orientation of ordered triplet (p, q, r).
// The function returns following values
// 0 --> p, q and r are collinear
// 1 --> Clockwise
// 2 --> Counterclockwise
const orientation = (p, q, r) => {
	const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);

	if (val === 0) return 0;
	return val > 0 ? 1 : 2;
};

export const doIntersect = (p1, q1, p2, q2) => {

	// Find the four orientations needed for general and special cases
	const o1 = orientation(p1, q1, p2);
	const o2 = orientation(p1, q1, q2);
	const o3 = orientation(p2, q2, p1);
	const o4 = orientation(p2, q2, q1);

	// General case
	if (o1 !== o2 && o3 !== o4) return true;
	return false;
};
