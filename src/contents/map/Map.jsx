import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FloorGrid } from '../../components/floorGrid/FloorGrid';
import { Suspense, useState } from 'react';
import { Button, Dropdown, Tooltip } from 'antd';
import { AppstoreFilled, DownCircleOutlined, DownOutlined, NodeIndexOutlined, RedoOutlined, RetweetOutlined, RiseOutlined, RollbackOutlined, UndoOutlined } from '@ant-design/icons';
import { MapTools, PointType } from '../../constants/dataEnum';
import { Wall } from '../../components/wall/Wall';

import './Map.scss';
import { Path, Point } from '../../components/path/Path';
import { FloorTextures, WallTextures } from '../../constants/textures';
import { isEqual } from 'lodash';
import { HoverMark } from '../../components/hoverMark/HoverMark';
import { generatePath, isInvalidLine } from '../../stores/businesses/pathingBusinesses';
import { WallPreset1, WallPreset2 } from '../../constants/presetWalls';
import delay from '../../libs/delay';
import { PointsPreset2 } from '../../constants/presetPoints';

const mapSize = {width: 50, length: 30};

const toolButtons = [
	{ key: MapTools.ORBIT, tooltip: 'Orbit (Q)', icon: <RetweetOutlined />},
	{ key: MapTools.WALL, tooltip: 'Wall (W)', icon: <AppstoreFilled />},
	{ key: MapTools.POINT, tooltip: 'Point (P)', icon: <DownCircleOutlined />},
	{ key: MapTools.MANUAL_PATH, tooltip: 'Manual Path (E)', icon: <RiseOutlined />},
	{ key: MapTools.AUTO_PATH, tooltip: 'Auto Path (Shift + E)', icon: <NodeIndexOutlined />},
	{ key: MapTools.CLEAR, tooltip: 'Clear (R)', icon: <RollbackOutlined />},
	{ key: MapTools.UNDO, tooltip: 'Undo (Ctrl + Z)', icon: <UndoOutlined />},
	{ key: MapTools.REDO, tooltip: 'Redo (Ctrl + Y)', icon: <RedoOutlined />},
];

const clearButtons = {
	walls: 'walls',
	points: 'points',
	paths: 'paths',
};

function Map() {
	const [floorTexture, setFloorTexture] = useState(FloorTextures[0].source);
	const [wallTexture, setWallTexture] = useState(WallTextures[0].source);
	const [selectedTool, selectTool] = useState(MapTools.ORBIT);
	const [histories, setHistories] = useState([{walls: [WallPreset2], paths: [], points: [PointsPreset2], selected: true}]);
	const [walls, setWalls] = useState(WallPreset2);
	const [points, setPoints] = useState(PointsPreset2);
	const [paths, setPaths] = useState([]);
	const [holdPos, setHoldPos] = useState();
	const [hoverPos, setHoverPos] = useState();

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

	let invalidLine;
	if ((isCreatingPath || isCreatingWall) && holdPos[1] === hoverPos[1]) {
		const obstacles = isCreatingPath ? walls : paths;
		invalidLine = isInvalidLine([holdPos[0], holdPos[2]], [hoverPos[0], hoverPos[2]], obstacles.filter(({y}) => y === holdPos[1]));
	}

	const updateHistory = (_walls, _paths, _points) => {
		const lastHistories = [...histories];
		const findIndex = lastHistories.findIndex((state) => state.selected);

		if (findIndex < lastHistories.length - 1) lastHistories.splice(findIndex + 1);

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
		case clearButtons.walls: updateWalls([]); break;
		case clearButtons.points: updatePoints([]); break;
		case clearButtons.paths: updatePaths([]); break;

		default: break;
		}
	};

	const clearItems = Object.values(clearButtons).map((item) => ({
		key: item,
		label: (
			<Button block type='default' onClick={() => handleClearItem(item)} >
				{item}
			</Button>
		),
	}));

	const handleOnHoverFloor = (pos) => {
		if (!isEqual(pos, hoverPos)) setHoverPos(pos);
	};

	const handleOnClickTools = (key) => {
		if (key === MapTools.CLEAR) {
			clearMap();
		} else if (key === MapTools.UNDO) {
			const findIndex = histories.findIndex((state) => state.selected);

			if (findIndex > 0) {
				const newIndex = findIndex - 1;
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

			if (findIndex >= 0 && findIndex < histories.length - 1) {
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
		case 'r': handleOnClickTools(MapTools.CLEAR); break;
		case 'p': handleOnClickTools(MapTools.POINT); break;
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
			const newId = walls.length > 0 ? walls[walls.length - 1].id + 1 : 1;
			const newWalls = [...walls, {id: newId, y: startY, start: [startX, startZ], end: [endX, endZ]}];
			updateWalls(newWalls);
			setHoldPos(hoverPos);
		}
	};

	const createPath = () => {
		const [startX, startY, startZ] = holdPos;
		const [endX, endY, endZ] = hoverPos;

		if (startY === endY && !invalidLine) {
			const newId = paths.length > 0 ? paths[paths.length - 1].id + 1 : 1;
			const newPaths = [...paths, {id: newId, y: startY, start: [startX, startZ], end: [endX, endZ]}];
			updatePaths(newPaths);
			setHoldPos(hoverPos);
		}
	};

	const createAutoPath = () => {
		const path = generatePath(holdPos, hoverPos, [...points, hoverPos], walls);
		const y = holdPos[1];
		const newPaths = [];

		path.forEach(({pos}, i) => {
			if (i > 0) {
				const start = [path[i-1].pos[0], path[i-1].pos[2]];
				const end = [pos[0], pos[2]];

				newPaths.push({id: i, y, start, end});
			}
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

	const handleOnClickFloor = (e) => {
		if (e.button === 0) {
			if ((selectedTool === MapTools.WALL || selectedTool === MapTools.MANUAL_PATH || selectedTool === MapTools.AUTO_PATH)) {
				if (holdPos) createObject();
				else setHoldPos(hoverPos);
			} else if (selectedTool === MapTools.POINT) {
				updatePoints([...points, hoverPos]);
			}
		}
	};

	return (
		<div autoFocus className='map-container' tabIndex={0} onKeyDown={handleOnKeyDown}>
			<Canvas
				camera={{fov: 50, position: [25, 10, 30]}}
				// onPointerDown={() => setHoldClick(true)}
				// onPointerUp={() => setHoldClick(false)}
			>
				<ambientLight intensity={1.2} />
				<Suspense fallback={undefined}>
					<FloorGrid
						size={mapSize}
						textureSource={floorTexture}
						onHover={handleOnHoverFloor}
						onPointerDown={handleOnClickFloor}
					/>

					{ isCreatingWall
						? <Wall y={holdPos[1]} start={[holdPos[0], holdPos[2]]} end={[hoverPos[0], hoverPos[2]]} textureSource={wallTexture} error={invalidLine} />
						: null
					}

					{ isCreatingPath
						? <Path y={holdPos[1]} start={[holdPos[0], holdPos[2]]} end={[hoverPos[0], hoverPos[2]]} error={invalidLine} />
						: null
					}

					{walls.map((wall) => <Wall key={wall.id} textureSource={wallTexture} {...wall} />)}
					{paths.map((path) => <Path key={path.id} {...path} />)}
					{points.map((point, i) => <Point key={i} position={point} />)}

					{ showSource
						? <HoverMark position={holdPos} type={selectedTool} label={PointType.SOURCE} labelColor='green' />
						: null
					}
					{ showHoverMark
						? <HoverMark position={hoverPos} type={selectedTool} wallTexture={wallTexture} label={hoverMarkLabel} labelColor={hoverMarkLabelColor} />
						: null
					}

				</Suspense>
				<OrbitControls
					makeDefault
					enableRotate={selectedTool === MapTools.ORBIT}
				/>
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
						Clear Item
					</Button>
				</Dropdown>
			</div>
		</div>
	);
}

export default Map;
