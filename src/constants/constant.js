// eslint-disable-next-line no-undef
export const DEV_MODE = process.env.NODE_ENV === 'development';

export const StairWidth = 3;
export const StairLength = 15;
export const PointHeight = 1.5;
export const WallHeight = 2;
export const MapSize = {width: 50, length: 30};
export const FloorsLevel = [0, 15];

export const Stairs = [
	{
		platforms: [
			[-StairWidth, 0, MapSize.length -StairWidth],
			[-StairWidth, FloorsLevel[1], MapSize.length -StairWidth -StairLength ],
		],
		start: [-(StairWidth/2), 0, MapSize.length -StairWidth],
		end: [-(StairWidth/2), FloorsLevel[1], MapSize.length -StairLength],
	},
	{
		platforms: [
			[MapSize.width, 0, MapSize.length -StairWidth],
			[MapSize.width, FloorsLevel[1], MapSize.length -StairWidth -StairLength ],
		],
		start: [MapSize.width + (StairWidth/2), 0, MapSize.length -StairWidth],
		end: [MapSize.width + (StairWidth/2), FloorsLevel[1], MapSize.length -StairLength],
	},
	{
		platforms: [
			[MapSize.width -StairWidth, 0, -StairWidth],
			[MapSize.width -StairLength -(StairWidth*2), FloorsLevel[1], -StairWidth],
		],
		start: [MapSize.width -StairWidth, 0, 0 -(StairWidth/2)],
		end: [MapSize.width -StairWidth -StairLength, FloorsLevel[1], 0 -(StairWidth/2)],
	},
];

export const StairsPoints = [
	[
		[ 2 -StairWidth, FloorsLevel[0], MapSize.length -2],
		[ 2 -StairWidth, FloorsLevel[1], MapSize.length -StairLength -1],
	],
	[
		[ MapSize.width +1, FloorsLevel[0], MapSize.length -2],
		[ MapSize.width +1, FloorsLevel[1], MapSize.length -StairLength -1],
	],
	[
		[ MapSize.width -2, FloorsLevel[0], 2 -StairWidth],
		[MapSize.length +1, FloorsLevel[1], 2 -StairWidth],
	],
];
