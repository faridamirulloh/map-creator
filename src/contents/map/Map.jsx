import { Canvas } from '@react-three/fiber';
import { Bounds, OrbitControls } from '@react-three/drei';
import { FloorGrid } from '../../components/floorGrid/FloorGrid';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Tooltip, message } from 'antd';
import { AppstoreFilled, DownCircleOutlined, DownOutlined, NodeIndexOutlined, RedoOutlined, RetweetOutlined, RiseOutlined, UndoOutlined } from '@ant-design/icons';
import { MapTools, PointType, ClearButtons, FloorType, ObjectType, ColorType } from '../../constants/dataEnum';
import { Wall } from '../../components/wall/Wall';

import './Map.scss';
import { Path, Point } from '../../components/path/Path';
import { FloorTextures, WallTextures } from '../../constants/textures';
import { cloneDeep, isEqual } from 'lodash';
import { HoverMark } from '../../components/hoverMark/HoverMark';
import { generatePath, isInvalidLine } from '../../stores/businesses/pathingBusinesses';
import { WallPreset1, WallPreset2 } from '../../constants/presetWalls';
import { PointsPreset1, PointsPreset2 } from '../../constants/presetPoints';
import { Stair } from '../../components/stair/Stair';
import { StairWidth, MapSize, FloorsLevel, Stairs, StairsPoints } from '../../constants/constant';
import { calculateDistance2D } from '../../libs/calcHelper';

const toolButtons = [
	{ key: MapTools.ORBIT, tooltip: 'Orbit (Q)', icon: <RetweetOutlined />},
	{ key: MapTools.WALL, tooltip: 'Wall (W)', icon: <AppstoreFilled />},
	{ key: MapTools.WAYPOINT, tooltip: 'Waypoint (A)', icon: <DownCircleOutlined />},
	{ key: MapTools.MANUAL_PATH, tooltip: 'Manual Path (E)', icon: <RiseOutlined />},
	{ key: MapTools.AUTO_PATH, tooltip: 'Auto Path (Shift + E)', icon: <NodeIndexOutlined />},
	{ key: MapTools.UNDO, tooltip: 'Undo (Ctrl + Z)', icon: <UndoOutlined />},
	{ key: MapTools.REDO, tooltip: 'Redo (Ctrl + Y)', icon: <RedoOutlined />},
];

const initPoints = [...PointsPreset1, ...PointsPreset2];
const initWalls = [...WallPreset1, ...WallPreset2];

function Map() {
	const [messageApi, contextHolder] = message.useMessage();
	const [loading, setLoading] = useState();
	const [floorTexture, setFloorTexture] = useState(FloorTextures[0].source);
	const [wallTexture, setWallTexture] = useState(WallTextures[0].source);
	const [selectedTool, selectTool] = useState(MapTools.ORBIT);
	const [histories, setHistories] = useState([{walls: initWalls, paths: [], points: initPoints, selected: true}]);
	const [walls, setWalls] = useState(initWalls);
	const [points, setPoints] = useState(initPoints);
	const [paths, setPaths] = useState([]);
	const [holdPos, setHoldPos] = useState();
	const [holdFloor, setHoldFloor] = useState({type: '', id: ''});
	const [sourcePos, setSourcePos] = useState();
	const [hoverPos, setHoverPos] = useState();
	const [hoverFloor, setHoverFloor] = useState({type: '', id: ''});
	const [toolTipContent, setToolTipContent] = useState();
	const [toolTipPos, setToolTipPos] = useState({});
	const pathGroupId = useRef(0);
	const showTooltip = useRef(false);
	const tooltipData = useRef();
	const tooltipRef = useRef();

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

	const showHoverMark = hoverPos && (((selectedTool === MapTools.WALL || selectedTool === MapTools.MANUAL_PATH || selectedTool === MapTools.WAYPOINT) && !holdPos ) || selectedTool === MapTools.AUTO_PATH);
	let hoverMarkLabel, hoverMarkLabelColor;
	if (showHoverMark && selectedTool === MapTools.AUTO_PATH) {
		if (!holdPos) {
			hoverMarkLabel = PointType.SOURCE;
			hoverMarkLabelColor = ColorType.SOURCE;
		} else {
			hoverMarkLabel = PointType.DESTINATION;
			hoverMarkLabelColor = ColorType.DESTINATION;
		}
	}

	const isCreatingWall = selectedTool === MapTools.WALL && holdPos && hoverPos && holdPos[1] === hoverPos[1];
	const isCreatingPath = (selectedTool === MapTools.MANUAL_PATH || selectedTool === MapTools.AUTO_PATH) && holdPos && hoverPos;

	let invalidLine = false;
	if ((isCreatingPath && selectedTool === MapTools.MANUAL_PATH) || (isCreatingWall && holdPos[1] === hoverPos[1])) {
		if (isCreatingPath && holdPos[1] !== hoverPos[1]) {
			if (holdFloor.type !== FloorType.STAIR || hoverFloor.type !== FloorType.STAIR || holdFloor.id !== hoverFloor.id) {
				invalidLine = true;
			}
		} else {
			const obstacles = isCreatingPath ? walls : paths;
			invalidLine = isInvalidLine([holdPos[0], holdPos[2]], [hoverPos[0], hoverPos[2]], obstacles.filter(({y, start}) => y ? y === holdPos[1] : start[1] === holdPos[1] ));
		}
	}

	const updateHistory = useCallback((_walls, _paths, _points) => {
		const lastHistories = [...histories];
		const findIndex = lastHistories.findIndex((state) => state.selected);

		if (findIndex < lastHistories.length -1) lastHistories.splice(findIndex + 1);

		setHistories([...lastHistories.map((state) => ({...state, selected: false})), {walls: _walls, paths: _paths, points: _points, selected: true}]);
	}, [histories]);

	const updateWalls = useCallback((_walls) => {
		setWalls(_walls);
		updateHistory(_walls, paths, points);
	}, [paths, points, updateHistory]);

	const updatePoints = useCallback((_points) => {
		setPoints(_points);
		updateHistory(walls, paths, _points);
	}, [paths, updateHistory, walls]);

	const updatePaths = useCallback((_paths) => {
		setPaths(_paths);
		updateHistory(walls, _paths, points);
	}, [points, updateHistory, walls]);

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
			if (key === selectedTool) selectTool(MapTools.ORBIT);
			else selectTool(key);
		}

		setHoldPos();
	};

	const handleOnKeyDown = (e) => {
		switch (e.key.toLowerCase()) {
		case 'q': handleOnClickTools(MapTools.ORBIT); break;
		case 'w': handleOnClickTools(MapTools.WALL); break;
		case 'e': handleOnClickTools(e.shiftKey? MapTools.AUTO_PATH : MapTools.MANUAL_PATH); break;
		case 'a': handleOnClickTools(MapTools.WAYPOINT); break;
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

	const handleOnClickFloor = useCallback((e, floorType = FloorType.FLAT, id) => {
		if (e.button === 0) {
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
				console.log('Create Path...', !invalidLine);
				if (!invalidLine) {
					const newPaths = cloneDeep(paths);
					const lastPath = newPaths[newPaths.length -1];
					const newId = newPaths.length > 0 ? lastPath.id + 1 : 1;
					let type = PointType.DESTINATION;

					if (lastPath && lastPath?.groupId === pathGroupId.current) lastPath.type = PointType.DIRECTION;

					const	distance =
						(lastPath && lastPath.type === PointType.DIRECTION ? lastPath.distance || 0 : 0)
						+ calculateDistance2D(holdPos[0], holdPos[2], hoverPos[0], hoverPos[2]);

					newPaths.push({
						id: newId,
						groupId: pathGroupId.current,
						type,
						start: holdPos,
						end: hoverPos,
						distance: Number(distance.toFixed(1)),
					});

					updatePaths(newPaths);
					setHoldPos(hoverPos);
				}
			};

			const createAutoPath = () => {
				console.log('Finding Shortest Path...');
				console.log('from : ', ...holdPos);
				console.log('to : ', ...hoverPos);
				try {
					const path = generatePath(holdPos, hoverPos, points, walls, StairsPoints);
					const y = holdPos[1];
					const newPaths = [];
					pathGroupId.current += 1;

					path.forEach(({pos, distance}, i) => {
						if (i > 0) {
							newPaths.push({
								id: i, y,
								start: path[i-1].pos,
								end: pos,
								groupId: pathGroupId.current,
								type: i === path.length -1 ? PointType.DESTINATION : PointType.DIRECTION,
								distance: Number(distance.toFixed(1)),
							});
						}
					});

					updatePaths([...paths, ...newPaths]);
					setHoldPos();
					console.log('Path Found!');
					messageApi.open({
						type: 'success',
						content: 'Path Found With Distance ' + path[path.length - 1]?.distance?.toFixed(1),
					});
				} catch (error) {
					messageApi.open({
						type: 'error',
						content: String(error),
					});
				}

				setLoading();
			};

			const initiateObject = () => {
				setHoldPos(hoverPos);

				switch (selectedTool) {
				case MapTools.MANUAL_PATH:
					pathGroupId.current = (paths[paths.length - 1]?.groupId || 0) +1;
				// eslint-disable-next-line no-fallthrough
				case MapTools.AUTO_PATH:
					setSourcePos(hoverPos);
					break;

				default:
					break;
				}
			};

			const createObject = () => {
				switch (selectedTool) {
				case MapTools.WALL: createWall(); break;
				case MapTools.MANUAL_PATH: createPath(); break;
				case MapTools.AUTO_PATH:
					setLoading('Finding Shortest Path...');
					setTimeout(createAutoPath, 1);
					break;

				default: break;
				}
			};

			switch (selectedTool) {
			case MapTools.MANUAL_PATH:
				if (!isEqual({type: floorType, id}, holdFloor)) setHoldFloor({type: floorType, id});
			// eslint-disable-next-line no-fallthrough
			case MapTools.WALL:
			case MapTools.AUTO_PATH:
				if (hoverPos){
					if (holdPos) createObject();
					else initiateObject();
				}
				break;

			case MapTools.WAYPOINT:
				updatePoints([...points, hoverPos]);
				break;

			default: break;
			}
		}
	}, [holdFloor, holdPos, hoverPos, invalidLine, messageApi, paths, points, selectedTool, updatePaths, updatePoints, updateWalls, walls]);

	const handleChangeTooltipContent = useCallback((e) => {
		let content = null;
		let data;

		const handleChangeTooltipPos = ({clientX, clientY}) => {
			const pos = {visibility: 'visible'};
			const {offsetHeight: vh, offsetWidth: vw} = document.body;
			const {offsetHeight: tooltipHeight, offsetWidth: tooltipWidth} = tooltipRef.current;

			if (clientX < vw - (tooltipWidth + 6)) pos.left = clientX + 5;
			else pos.right = vw - clientX + 5;

			if (clientY > tooltipHeight + 6) pos.bottom = vh - clientY + 5;
			else pos.top = clientY + 5;

			if (!isEqual(pos, toolTipPos)) setToolTipPos(pos);
		};

		const handleHideTooltip = () => {
			const pos = {visibility: 'hidden'};
			if (!isEqual(pos, toolTipPos)) setToolTipPos(pos);
		};

		if (selectedTool === MapTools.ORBIT && e?.intersections.length > 0) {
			const {name, userData} = e.intersections[0].eventObject;
			data = userData;

			switch (name) {
			case PointType.WAYPOINT:
				content = (
					<>
						<div className='tooltip-label'>
							Name
							<br />
							Pos
						</div>
						<div className='tooltip-value'>
							: {name}
							<br />
							: [ {userData} ]
						</div>
					</>
				);
				break;
			case ObjectType.WALL:
				content = (
					<>
						<div className='tooltip-label'>
							Name
							<br />
							Length
							<br />
							Start Pos
							<br />
							End Pos
							<br />
							Y
						</div>
						<div className='tooltip-value'>
							: {name}
							<br />
							: {calculateDistance2D(...userData.start, ...userData.end)}
							<br />
							: [ {userData.start.join(', ')} ]
							<br />
							: [ {userData.end.join(', ')} ]
							<br />
							: {userData.y}
						</div>
					</>
				);
				break;
			case PointType.PATH:
				content = (
					<>
						<div className='tooltip-label'>
							Name
							<br />
							Type
							<br />
							Path Id
							<br />
							Pos
							<br />
							Distance
						</div>
						<div className='tooltip-value'>
							: {name}
							<br />
							: {userData.type}
							<br />
							: {userData.groupId}
							<br />
							: [ {[userData.end].join(', ')} ]
							<br />
							: {userData.distance}
						</div>
					</>
				);
				break;

			default:
				break;
			}

			if (content) handleChangeTooltipPos({clientX: e.clientX, clientY: e.clientY});
		}

		showTooltip.current = Boolean(content);
		if (!showTooltip.current) handleHideTooltip();
		if (data !== tooltipData.current) {
			setToolTipContent(content);
			tooltipData.current = data;
		}
	}, [selectedTool, toolTipPos]);

	const floorsObj = useMemo(() => {
		const handlePointerMove = (e) => {
			const obj = e.intersections.find(({eventObject}) => eventObject.name === ObjectType.FLOOR);
			if (obj) {
				const {x, y, z} = obj.point;
				const pos = [
					Number(x.toFixed(0)),
					Number(y.toFixed(0)),
					Number(z.toFixed(0)),
				];

				if (!isEqual(pos, hoverPos)) setHoverPos(pos);
				if (!isEqual(obj.eventObject.userData, hoverFloor)) setHoverFloor(obj.eventObject.userData);
			}
		};

		return (
			<group
				onPointerMove={handlePointerMove}
				onPointerLeave={() => {
					setHoverPos();
					setHoverFloor();
				}}
			>
				{FloorsLevel.map((floor, i) =>
					<FloorGrid
						key={i}
						id={i}
						type={FloorType.FLAT}
						position={[0, floor, 0]}
						size={MapSize}
						textureSource={floorTexture}
						onPointerDown={handleOnClickFloor}
					/>,
				)}
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
								id={stairIdx}
								type={FloorType.STAIR}
								position={_pos}
								size={{width: StairWidth, length: StairWidth}}
								textureSource={floorTexture}
								onPointerDown={(e) => handleOnClickFloor(e, FloorType.STAIR, stairIdx)}
							/>)
						}
					</group>,
				)}
			</group>
		);
	}, [floorTexture, handleOnClickFloor, hoverFloor, hoverPos]);

	const wallsObj = useMemo(() => (
		walls.map((wall) => (
			<group
				key={wall.id}
				name={ObjectType.WALL}
				userData={wall}
				onPointerMove={handleChangeTooltipContent}
				onPointerLeave={() => handleChangeTooltipContent()}
			>
				<Wall textureSource={wallTexture} {...wall} />
			</group>
		))
	), [handleChangeTooltipContent, wallTexture, walls]);

	const pathsObj = useMemo(() => {
		const content = [];
		let currentPathId = null;

		paths.forEach((path, i) => {
			if (i === 0 || path.groupId !== currentPathId) {
				currentPathId = path.groupId;

				content.push(
					<group
						key={'start-' + path.groupId}
						name={PointType.PATH}
						userData={{
							type: PointType.SOURCE,
							groupId: path.groupId,
							start: path.start,
							end: path.start,
							distance: 0,
						}}
						onPointerMove={handleChangeTooltipContent}
						onPointerLeave={() => handleChangeTooltipContent()}
					>
						<HoverMark
							position={path.start}
							type={MapTools.MANUAL_PATH}
							label={PointType.SOURCE}
							labelColor={ColorType.SOURCE}
						/>
					</group>,
				);
			}

			content.push(
				<group
					key={[path.groupId, path.id].join('-')}
					name={PointType.PATH}
					userData={path}
					onPointerMove={handleChangeTooltipContent}
					onPointerLeave={() => handleChangeTooltipContent()}
				>
					<Path {...path} />
				</group>,
			);
		});

		return content;
	}, [handleChangeTooltipContent, paths]);

	const pointsObj = useMemo(() => (
		points.map((point, i) =>
			(
				<group
					key={i}
					name={PointType.WAYPOINT}
					userData={point.join(', ')}
					onPointerMove={handleChangeTooltipContent}
					onPointerLeave={() => handleChangeTooltipContent()}
				>
					<Point position={point} />
				</group>
			),
		)
	), [handleChangeTooltipContent, points]);

	const stairsPointsObj = useMemo(() => (
		StairsPoints.map(
			(points, stairIdx) => points.map(
				(point, ptIdx) => <Point key={`${stairIdx}-${ptIdx}`} position={point} />,
			),
		)
	), []);

	return (
		<div className='map-container' tabIndex={0} onKeyDown={handleOnKeyDown} >
			<Canvas camera={{fov: 50, position: [20, 14, 30]}} >
				<ambientLight intensity={1.2} />
				<Suspense fallback={undefined}>
					<Bounds fit clip observe margin={0.9}>
						{floorsObj}
						{wallsObj}
						{pathsObj}
						{pointsObj}
						{stairsPointsObj}
						{/* {stairsObj} */}

						{ isCreatingWall
							? <Wall y={holdPos[1]} start={[holdPos[0], holdPos[2]]} end={[hoverPos[0], hoverPos[2]]} textureSource={wallTexture} error={invalidLine} />
							: null
						}

						{ isCreatingPath
							? <Path start={holdPos} end={hoverPos} error={invalidLine} />
							: null
						}

						{ isCreatingPath
							? <HoverMark position={sourcePos} type={selectedTool} label={PointType.SOURCE} labelColor={ColorType.SOURCE} />
							: null
						}
						{ showHoverMark
							? <HoverMark position={hoverPos} type={selectedTool} wallTexture={wallTexture} label={hoverMarkLabel} labelColor={hoverMarkLabelColor} />
							: null
						}

					</Bounds>
				</Suspense>
				<OrbitControls makeDefault enableRotate={selectedTool === MapTools.ORBIT} />
			</Canvas>

			<div className='map-tools' >
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

			<div ref={tooltipRef} className="tooltip-container" style={showTooltip.current ? toolTipPos : null} >
				{toolTipContent && toolTipContent}
			</div>

			{contextHolder}
			{loading ?
				<div className='loading'>
					<div className='text-border'>
						{loading}
					</div>
				</div>
				: null
			}
		</div>
	);
}

export default Map;
