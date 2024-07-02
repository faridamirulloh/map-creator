import { Canvas } from '@react-three/fiber';
import { Bounds, OrbitControls } from '@react-three/drei';
import { FloorGrid } from '../../components/floorGrid/FloorGrid';
import { Suspense, useState } from 'react';
import { Button, Dropdown, Tooltip } from 'antd';
import { AppstoreFilled, DownCircleOutlined, DownOutlined, NodeIndexOutlined, RedoOutlined, RetweetOutlined, RiseOutlined, UndoOutlined } from '@ant-design/icons';
import { MapTools, PointType, ClearButtons, FloorType } from '../../constants/dataEnum';
import { Wall } from '../../components/wall/Wall';

import './Map.scss';
import { Path, Point } from '../../components/path/Path';
import { FloorTextures, WallTextures } from '../../constants/textures';
import { isEqual } from 'lodash';
import { HoverMark } from '../../components/hoverMark/HoverMark';
import { generatePath, isInvalidLine } from '../../stores/businesses/pathingBusinesses';
import { WallPreset1, WallPreset2 } from '../../constants/presetWalls';
import { PointsPreset1, PointsPreset2 } from '../../constants/presetPoints';
import { Stair } from '../../components/stair/Stair';
import { StairWidth, MapSize, FloorsLevel, Stairs, StairsPoints } from '../../constants/constant';

const toolButtons = [
	{ key: MapTools.ORBIT, tooltip: 'Orbit (Q)', icon: <RetweetOutlined />},
	{ key: MapTools.WALL, tooltip: 'Wall (W)', icon: <AppstoreFilled />},
	{ key: MapTools.POINT, tooltip: 'Point (A)', icon: <DownCircleOutlined />},
	{ key: MapTools.MANUAL_PATH, tooltip: 'Manual Path (E)', icon: <RiseOutlined />},
	{ key: MapTools.AUTO_PATH, tooltip: 'Auto Path (Shift + E)', icon: <NodeIndexOutlined />},
	{ key: MapTools.UNDO, tooltip: 'Undo (Ctrl + Z)', icon: <UndoOutlined />},
	{ key: MapTools.REDO, tooltip: 'Redo (Ctrl + Y)', icon: <RedoOutlined />},
];

const initPoints = [...PointsPreset1, ...PointsPreset2];
const initWalls = [...WallPreset1, ...WallPreset2];

function Map() {
	const [floorTexture, setFloorTexture] = useState(FloorTextures[0].source);
	const [wallTexture, setWallTexture] = useState(WallTextures[0].source);
	const [selectedTool, selectTool] = useState(MapTools.ORBIT);
	const [histories, setHistories] = useState([{walls: initWalls, paths: [], points: initPoints, selected: true}]);
	const [walls, setWalls] = useState(initWalls);
	const [points, setPoints] = useState(initPoints);
	const [paths, setPaths] = useState([]);
	const [holdPos, setHoldPos] = useState();
	const [holdFloor, setHoldFloor] = useState({type: '', id: ''});
	const [hoverPos, setHoverPos] = useState();
	const [hoverFloor, setHoverFloor] = useState({type: '', id: ''});

	const floorItems = FloorTextures.map((floor) => ({
		key: floor.label,
		label: (
			<Button block type={floor.source === floorTexture ? 'primary' : 'default'} onClick={() => setFloorTexture(floor.source)} >
				{floor.label}
			</Button>
		),
	}));

	const wallItems = WallTextures.map((wall) => ({
		key: wall.label,
		label: (
			<Button block type={wall.source === wallTexture ? 'primary' : 'default'} onClick={() => setWallTexture(wall.source)} >
				{wall.label}
			</Button>
		),
	}));

	const showSource = selectedTool === MapTools.AUTO_PATH && holdPos;
	const showHoverMark = hoverPos && (((selectedTool === MapTools.WALL || selectedTool === MapTools.MANUAL_PATH || selectedTool === MapTools.POINT) && !holdPos ) || selectedTool === MapTools.AUTO_PATH);
	let hoverMarkLabel, hoverMarkLabelColor;
	if (showHoverMark && selectedTool === MapTools.AUTO_PATH) {
		if (!holdPos) {
			hoverMarkLabel = PointType.SOURCE;
			hoverMarkLabelColor = 'green';
		} else {
			hoverMarkLabel = PointType.DESTINATION;
			hoverMarkLabelColor = 'red';
		}
	}

	const isCreatingWall = selectedTool === MapTools.WALL && holdPos && hoverPos && holdPos[1] === hoverPos[1];
	const isCreatingPath = selectedTool === MapTools.MANUAL_PATH && holdPos && hoverPos;

	let invalidLine = false;
	if (isCreatingPath || (isCreatingWall && holdPos[1] === hoverPos[1])) {
		if (isCreatingPath && holdPos[1] !== hoverPos[1]) {
			if (holdFloor.type !== FloorType.STAIR || hoverFloor.type !== FloorType.STAIR || holdFloor.id !== hoverFloor.id) {
				invalidLine = true;
			}
		} else {
			const obstacles = isCreatingPath ? walls : paths;
			invalidLine = isInvalidLine([holdPos[0], holdPos[2]], [hoverPos[0], hoverPos[2]], obstacles.filter(({y}) => y === holdPos[1]));
		}
	}

	const updateHistory = (_walls, _paths, _points) => {
		const lastHistories = [...histories];
		const findIndex = lastHistories.findIndex((state) => state.selected);

		if (findIndex < lastHistories.length -1) lastHistories.splice(findIndex + 1);

		setHistories([...lastHistories.map((state) => ({...state, selected: false})), {walls: _walls, paths: _paths, points: _points, selected: true}]);
	};

	const updateWalls = (_walls) => {
		setWalls(_walls);
		updateHistory(_walls, paths, points);
	};

	const updatePoints = (_points) => {
		setPoints(_points);
		updateHistory(walls, paths, _points);
	};

	const updatePaths = (_paths) => {
		setPaths(_paths);
		updateHistory(walls, _paths, points);
	};

	const clearMap = () => {
		setWalls([]);
		setPoints([]);
		setPaths([]);
		updateHistory([], [], []);
	};

	const handleClearItem = (item) => {
		switch (item) {
		case ClearButtons.ALL: clearMap([]); break;
		case ClearButtons.WALLS: updateWalls([]); break;
		case ClearButtons.POINTS: updatePoints([]); break;
		case ClearButtons.PATHS: updatePaths([]); break;

		default: break;
		}
	};

	const clearItems = Object.values(ClearButtons).map((item) => ({
		key: item,
		label: (
			<Button block type='default' onClick={() => handleClearItem(item)} >
				{item}
			</Button>
		),
	}));

	const handleOnClickTools = (key) => {
		if (key === MapTools.UNDO) {
			const findIndex = histories.findIndex((state) => state.selected);

			if (findIndex > 0) {
				const newIndex = findIndex -1;
				const newHistories = [...histories];
				newHistories[findIndex].selected = false;
				newHistories[newIndex].selected = true;

				setWalls(newHistories[newIndex].walls);
				setPoints(newHistories[newIndex].points);
				setPaths(newHistories[newIndex].paths);
				setHistories(newHistories);
			}
		} else if (key === MapTools.REDO) {
			const findIndex = histories.findIndex((state) => state.selected);

			if (findIndex >= 0 && findIndex < histories.length -1) {
				const newIndex = findIndex + 1;
				const newHistories = [...histories];
				newHistories[findIndex].selected = false;
				newHistories[newIndex].selected = true;

				setWalls(newHistories[newIndex].walls);
				setPoints(newHistories[newIndex].points);
				setPaths(newHistories[newIndex].paths);
				setHistories(newHistories);
			}
		} else {
			if (key === selectedTool) selectTool();
			else selectTool(key);
		}

		setHoldPos();
	};

	const handleOnKeyDown = (e) => {
		switch (e.key.toLowerCase()) {
		case 'q': handleOnClickTools(MapTools.ORBIT); break;
		case 'w': handleOnClickTools(MapTools.WALL); break;
		case 'e': handleOnClickTools(e.shiftKey? MapTools.AUTO_PATH : MapTools.MANUAL_PATH); break;
		case 'a': handleOnClickTools(MapTools.POINT); break;
		case 'escape': setHoldPos(); break;
		default: break;
		}

		if (e.ctrlKey) {
			switch (e.key.toLowerCase()) {
			case 'z': handleOnClickTools(MapTools.UNDO); break;
			case 'y': handleOnClickTools(MapTools.REDO); break;
			default: break;
			}
		}
	};

	const createWall = () => {
		const [startX, startY, startZ] = holdPos;
		const [endX, endY, endZ] = hoverPos;

		if (startY === endY && !invalidLine) {
			const newId = walls.length > 0 ? walls[walls.length -1].id + 1 : 1;
			const newWalls = [...walls, {id: newId, y: startY, start: [startX, startZ], end: [endX, endZ]}];
			updateWalls(newWalls);
			setHoldPos(hoverPos);
		}
	};

	const createPath = () => {
		if (!invalidLine) {
			const newId = paths.length > 0 ? paths[paths.length -1].id + 1 : 1;
			const newPaths = [...paths, {id: newId, start: holdPos, end: hoverPos}];
			updatePaths(newPaths);
			setHoldPos(hoverPos);
		}
	};

	const createAutoPath = () => {
		console.log('Generating path...');
		const path = generatePath(holdPos, hoverPos, points, walls, StairsPoints);
		const y = holdPos[1];
		const newPaths = [];

		path.forEach(({pos}, i) => {
			if (i > 0) newPaths.push({id: i, y, start: path[i-1].pos, end: pos});
		});

		updatePaths(newPaths);
		setHoldPos();
	};

	const createObject = () => {
		switch (selectedTool) {
		case MapTools.WALL: createWall(); break;
		case MapTools.MANUAL_PATH: createPath(); break;
		case MapTools.AUTO_PATH: createAutoPath(); break;

		default: break;
		}
	};

	const handleOnHoverFloor = (pos, floorType = FloorType.FLAT, id) => {
		if (!isEqual(pos, hoverPos)) setHoverPos(pos);
		if (!isEqual({type: floorType, id}, hoverFloor)) setHoverFloor({type: floorType, id});
	};

	const handleOnClickFloor = (e, floorType = FloorType.FLAT, id) => {
		if (e.button === 0) {
			switch (selectedTool) {
			case MapTools.MANUAL_PATH:
				if (!isEqual({type: floorType, id}, holdFloor)) setHoldFloor({type: floorType, id});
			// eslint-disable-next-line no-fallthrough
			case MapTools.WALL:
			case MapTools.AUTO_PATH:
				if (holdPos) createObject();
				else setHoldPos(hoverPos);
				break;

			case MapTools.POINT:
				updatePoints([...points, hoverPos]);
				break;

			default: break;
			}
		}
	};

	return (
		<div className='map-container' tabIndex={0} onKeyDown={handleOnKeyDown} >
			<Canvas
				camera={{fov: 50, position: [20, 14, 30]}}
				// onPointerDown={() => setHoldClick(true)}
				// onPointerUp={() => setHoldClick(false)}
			>
				<ambientLight intensity={1.2} />
				<Suspense fallback={undefined}>
					<Bounds fit clip observe margin={0.9}>
						{FloorsLevel.map((floor) =>
							<FloorGrid
								key={floor}
								position={[0, floor, 0]}
								size={MapSize}
								textureSource={floorTexture}
								onHover={handleOnHoverFloor}
								onPointerDown={handleOnClickFloor}
							/>,
						)}

						{ isCreatingWall
							? <Wall y={holdPos[1]} start={[holdPos[0], holdPos[2]]} end={[hoverPos[0], hoverPos[2]]} textureSource={wallTexture} error={invalidLine} />
							: null
						}

						{ isCreatingPath
							? <Path start={holdPos} end={hoverPos} error={invalidLine} />
							: null
						}

						{walls.map((wall) => <Wall key={wall.id} textureSource={wallTexture} {...wall} />)}
						{paths.map((path) => <Path key={path.id} {...path} />)}
						{points.map((point, i) =>
							(
								<group name={PointType.POINT_GUIDE} key={i} >
									<Point position={point} />
								</group>
							),
						)}

						{StairsPoints.map(
							(points, stairIdx) => points.map(
								(point, ptIdx) => <Point key={`${stairIdx}-${ptIdx}`} position={point} />,
							),
						)}

						{ showSource
							? <HoverMark position={holdPos} type={selectedTool} label={PointType.SOURCE} labelColor='green' />
							: null
						}
						{ showHoverMark
							? <HoverMark position={hoverPos} type={selectedTool} wallTexture={wallTexture} label={hoverMarkLabel} labelColor={hoverMarkLabelColor} />
							: null
						}

						{Stairs.map((stair, stairIdx) =>
							<group key={stairIdx}>
								<Stair
									textureSource={floorTexture}
									start={stair.start}
									end={stair.end}
								/>
								{stair.platforms.map((_pos, platIdx) =>
									<FloorGrid
										key={platIdx}
										position={_pos}
										size={{width: StairWidth, length: StairWidth}}
										textureSource={floorTexture}
										onHover={(pos) => handleOnHoverFloor(pos, FloorType.STAIR, stairIdx)}
										onPointerDown={(e) => handleOnClickFloor(e, FloorType.STAIR, stairIdx)}
									/>)
								}
							</group>)
						}

					</Bounds>
				</Suspense>
				<OrbitControls makeDefault enableRotate={selectedTool === MapTools.ORBIT} />
			</Canvas>

			<div style={{ display: 'flex', position: 'absolute', top: 0, padding: 8, gap: 8}}>
				{toolButtons.map((button) => (
					<Tooltip key={button.key} title={button.tooltip} >
						<Button
							type={selectedTool === button.key ? 'primary' : 'default'}
							shape="circle"
							icon={button.icon}
							onClick={() => handleOnClickTools(button.key)}
						/>
					</Tooltip>
				))}
				<Dropdown menu={{items: floorItems}} trigger={['click']} >
					<Button type={'default'} icon={<DownOutlined />} iconPosition='end' >
						Floor Textures
					</Button>
				</Dropdown>
				<Dropdown menu={{items: wallItems}} trigger={['click']} >
					<Button type={'default'} icon={<DownOutlined />} iconPosition='end' >
						Wall Textures
					</Button>
				</Dropdown>
				<Dropdown menu={{items: clearItems}} trigger={['click']} >
					<Button type={'default'} icon={<DownOutlined />} iconPosition='end' >
						Clear Items
					</Button>
				</Dropdown>
			</div>
		</div>
	);
}

export default Map;
