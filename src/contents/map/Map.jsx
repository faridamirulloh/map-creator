import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FloorGrid } from '../../components/floorGrid/FloorGrid';
import { Suspense, useState } from 'react';
import { Button, Dropdown, Tooltip } from 'antd';
import { AppstoreFilled, ArrowRightOutlined, DownOutlined, RedoOutlined, RetweetOutlined, RollbackOutlined, UndoOutlined } from '@ant-design/icons';
import { MapTools } from '../../constants/dataEnum';
import { Wall } from '../../components/wall/Wall';

import './Map.scss';
import { Path } from '../../components/path/Path';
import { FloorTextures, WallTextures } from '../../constants/textures';
import { isEqual } from 'lodash';
import { HoverMark } from '../../components/hoverMark/HoverMark';
import { isWrongPath } from '../../stores/businesses/pathingBusinesses';
import { WallPreset1 } from '../../constants/presetWalls';

const toolButtons = [
	{ key: MapTools.ORBIT, tooltip: 'Orbit (Q)', icon: <RetweetOutlined />},
	{ key: MapTools.WALL, tooltip: 'Wall (W)', icon: <AppstoreFilled />},
	{ key: MapTools.PATH, tooltip: 'Manual Path (E)', icon: <ArrowRightOutlined />},
	{ key: MapTools.CLEAR, tooltip: 'Clear (R)', icon: <RollbackOutlined />},
	{ key: MapTools.UNDO, tooltip: 'Undo (Ctrl + Z)', icon: <UndoOutlined />},
	{ key: MapTools.REDO, tooltip: 'Redo (Ctrl + Y)', icon: <RedoOutlined />},
];

function Map() {
	const [floorTexture, setFloorTexture] = useState(FloorTextures[0].source);
	const [wallTexture, setWallTexture] = useState(WallTextures[0].source);
	const [selectedTool, selectTool] = useState(MapTools.ORBIT);
	// const [onHoldClick, setHoldClick] = useState(false);
	const [histories, setHistories] = useState([{walls: [WallPreset1], paths: [], selected: true}]);
	const [walls, setWalls] = useState(WallPreset1);
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

	const showHoverMark = hoverPos && !holdPos && (selectedTool === MapTools.WALL || selectedTool === MapTools.PATH);
	const isCreatingWall = selectedTool === MapTools.WALL && holdPos && hoverPos && holdPos[1] === hoverPos[1];
	const isCreatingPath = selectedTool === MapTools.PATH && holdPos && hoverPos;

	let wrongPath;
	if ((isCreatingPath || isCreatingWall) && holdPos[1] === hoverPos[1]) {
		const obstacles = isCreatingPath ? walls : paths;
		wrongPath = isWrongPath(holdPos, hoverPos, obstacles.filter(({y}) => y === holdPos[1]));
	}

	const updateHistory = (_walls, _paths) => {
		const lastHistories = [...histories];
		const findIndex = lastHistories.findIndex((state) => state.selected);

		if (findIndex < lastHistories.length - 1) lastHistories.splice(findIndex + 1);

		setHistories([...lastHistories.map((state) => ({...state, selected: false})), {walls: _walls, paths: _paths, selected: true}]);
	};

	const handleOnHoverFloor = (pos) => {
		if (!isEqual(pos, hoverPos)) setHoverPos(pos);
	};

	const handleOnClickTools = (key) => {
		if (key === MapTools.CLEAR) {
			setWalls([]);
			setPaths([]);
			updateHistory([], []);
		} else if (key === MapTools.UNDO) {
			const findIndex = histories.findIndex((state) => state.selected);

			if (findIndex > 0) {
				const newIndex = findIndex - 1;
				const newHistories = [...histories];
				newHistories[findIndex].selected = false;
				newHistories[newIndex].selected = true;

				setWalls(newHistories[newIndex].walls);
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
		case 'e': handleOnClickTools(MapTools.PATH); break;
		case 'r': handleOnClickTools(MapTools.CLEAR); break;
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
		const [endtX, endtY, endtZ] = hoverPos;

		if (startY === endtY && !wrongPath) {
			const newId = walls.length > 0 ? walls[walls.length - 1].id + 1 : 1;
			const newWalls = [...walls, {id: newId, y: startY, start: [startX, startZ], end: [endtX, endtZ]}];
			setWalls(newWalls);
			updateHistory(newWalls, paths);
			setHoldPos(hoverPos);
		}
	};

	const createPath = () => {
		const [startX, startY, startZ] = holdPos;
		const [endtX, endtY, endtZ] = hoverPos;

		if (startY === endtY && !wrongPath) {
			const newId = paths.length > 0 ? paths[paths.length - 1].id + 1 : 1;
			const newPaths = [...paths, {id: newId, y: startY, start: [startX, startZ], end: [endtX, endtZ]}];
			setPaths(newPaths);
			updateHistory(walls, newPaths);
			setHoldPos(hoverPos);
		}
	};

	const createObject = () => {
		switch (selectedTool) {
		case MapTools.WALL: createWall(); break;
		case MapTools.PATH: createPath(); break;

		default: break;
		}
	};

	const handleOnClickFloor = (e) => {
		if (e.button === 0 && (selectedTool === MapTools.WALL || selectedTool === MapTools.PATH)) {
			if (holdPos) createObject();
			else setHoldPos(hoverPos);
		}
	};

	return (
		<div className='map-container' tabIndex={0} onKeyDown={handleOnKeyDown}>
			<Canvas
				camera={{fov: 50, position: [25, 10, 30]}}
				// onPointerDown={() => setHoldClick(true)}
				// onPointerUp={() => setHoldClick(false)}
			>
				<ambientLight intensity={1.2} />
				<Suspense fallback={undefined}>
					<FloorGrid
						size={{width: 50, length: 30}}
						textureSource={floorTexture}
						onHover={handleOnHoverFloor}
						onPointerDown={handleOnClickFloor}
					/>
					{isCreatingWall ? <Wall y={holdPos[1]} start={[holdPos[0], holdPos[2]]} end={[hoverPos[0], hoverPos[2]]} textureSource={wallTexture} error={wrongPath} /> : null}
					{isCreatingPath ? <Path y={holdPos[1]} start={[holdPos[0], holdPos[2]]} end={[hoverPos[0], hoverPos[2]]} error={wrongPath} /> : null}
					{walls.map((wall) => <Wall key={wall.id} textureSource={wallTexture} {...wall} />)}
					{paths.map((path) => <Path key={path.id} {...path} />)}

					{showHoverMark ? <HoverMark position={hoverPos} type={selectedTool} wallTexture={wallTexture} /> : null}
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
			</div>
		</div>
	);
}

export default Map;
