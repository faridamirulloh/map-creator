import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { FloorGrid } from '../../components/floorGrid/FloorGrid';
import { Suspense, useState } from 'react';
import { Button, Tooltip } from 'antd';
import { AppstoreFilled, ArrowRightOutlined, RedoOutlined, RetweetOutlined, RollbackOutlined, UndoOutlined } from '@ant-design/icons';
import { MapTools } from '../../constants/constant';
import { Wall } from '../../components/wall/Wall';

import './Map.scss';
import { Path } from '../../components/path/Path';

const toolButtons = [
	{ key: MapTools.ORBIT, tooltip: 'Orbit (Q)', icon: <RetweetOutlined />},
	{ key: MapTools.WALL, tooltip: 'Wall (W)', icon: <AppstoreFilled />},
	{ key: MapTools.PATH, tooltip: 'Path (E)', icon: <ArrowRightOutlined />},
	{ key: MapTools.CLEAR, tooltip: 'Clear (R)', icon: <RollbackOutlined />},
	{ key: MapTools.UNDO, tooltip: 'Undo (Ctrl + Z)', icon: <UndoOutlined />},
	{ key: MapTools.REDO, tooltip: 'Redo (Ctrl + Y)', icon: <RedoOutlined />},
];

const initWall = {id: -1, pos: [0, -1]};
const initPath = {start: [0, 0], end: [1, 1]};

function Map() {
	const [selectedTool, selectTool] = useState(MapTools.ORBIT);
	const [onHoldClick, setHoldClick] = useState(false);
	const [histories, setHistories] = useState([{walls: [initWall], paths: [initPath], selected: true}]);
	const [walls, setWalls] = useState([initWall]);
	const [paths, setPaths] = useState([initPath]);
	const [selectedTile, selectTile] = useState();

	const handleOnClickTools = (key) => {
		if (key === MapTools.CLEAR) {
			setWalls([]);
			setPaths([]);
			selectTile();
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
	};

	const handleOnKeyDown = (e) => {
		switch (e.key.toLowerCase()) {
		case 'q': handleOnClickTools(MapTools.ORBIT); break;
		case 'w': handleOnClickTools(MapTools.WALL); break;
		case 'e': handleOnClickTools(MapTools.PATH); break;
		case 'r': handleOnClickTools(MapTools.CLEAR); break;
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

	const handleSetHistory = (_walls, _paths) => {
		setHistories((lastState) => ([...lastState.map((state) => ({...state, selected: false})), {walls: _walls, paths: _paths, selected: true}]));
	};

	const handleOnHoverFloor = (_id, pos) => {
		if (selectedTool === MapTools.WALL){
			const newWalls = [...walls];
			const foundIndex = newWalls.findIndex(({id}) => id === _id);

			if (foundIndex >= 0) {
				newWalls.splice(foundIndex, 1);
			} else {
				newWalls.push({id: _id, pos});
			}

			setWalls(newWalls);
			handleSetHistory(newWalls, paths);
		} else if (selectedTool === MapTools.PATH) {
			if (!selectedTile) selectTile({id: _id, pos});
			else {
				selectTile();
				const newPaths = [...paths, {start: selectedTile.pos, end: pos}];
				setPaths(newPaths);
				handleSetHistory(walls, newPaths);
			}
		}
	};

	return (
		<div className='map-container' tabIndex={0} onKeyDown={handleOnKeyDown}>
			<Canvas
				camera={{fov: 50, position: [10, 20, 30]}}
				onPointerDown={() => setHoldClick(true)}
				onPointerUp={() => setHoldClick(false)}
			>
				<ambientLight intensity={1.2} />
				<Suspense fallback={undefined}>
					<FloorGrid
						size={{width: 30, length: 20}}
						selectedTile={selectedTile?.id}
						onHover={(id, pos) => onHoldClick && handleOnHoverFloor(id, pos)}
						onPointerDown={handleOnHoverFloor}
					/>
					{walls.map((wall) => <Wall key={wall.id} position={wall.pos} />)}
					{paths.map((path, i) => <Path key={i} line={path} />)}
				</Suspense>
				<OrbitControls
					makeDefault
					enableRotate={selectedTool === MapTools.ORBIT}
					enableZoom={selectedTool === MapTools.ORBIT}
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
			</div>
		</div>
	);
}

export default Map;
