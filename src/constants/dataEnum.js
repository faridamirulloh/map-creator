export const MapTools = {
	ORBIT: 'ORBIT',
	WALL: 'WALL',
	POINT: 'POINT',
	MANUAL_PATH: 'MANUAL_PATH',
	AUTO_PATH: 'AUTO_PATH',
	CLEAR: 'CLEAR',
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
	SOURCE: 'SOURCE',
	DESTINATION: 'DESTINATION',
	STAIR: 'STAIR',
};
