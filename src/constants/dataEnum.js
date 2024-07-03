export const MapTools = {
	ORBIT: 'ORBIT',
	WALL: 'WALL',
	POINT: 'POINT',
	MANUAL_PATH: 'MANUAL_PATH',
	AUTO_PATH: 'AUTO_PATH',
	UNDO: 'UNDO',
	REDO: 'REDO',
};

export const MarkType = {
	[MapTools.WALL]: MapTools.WALL,
	[MapTools.POINT]: MapTools.POINT,
	[MapTools.MANUAL_PATH]: MapTools.MANUAL_PATH,
	[MapTools.AUTO_PATH]: MapTools.AUTO_PATH,
};

export const PointType = {
	DESTINATION: 'Destination',
	DIRECTION: 'Direction',
	PATH: 'Path',
	POINT_GUIDE: 'Guide Point',
	SOURCE: 'Source',
	STAIR: 'Stair',
};

export const ObjectType = {
	POINT: 'Point',
	WALL: 'Wall',
};

export const ClearButtons = {
	ALL: 'All',
	WALLS: 'Walls',
	POINTS: 'Points',
	PATHS: 'Paths',
};

export const FloorType = {
	FLAT: 'FLAT',
	STAIR: 'STAIR',
};

export const ColorType = {
	SOURCE: 'green',
	DESTINATION: 'blue',
};
