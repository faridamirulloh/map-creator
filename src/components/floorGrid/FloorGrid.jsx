import PropTypes from 'prop-types';
import { RepeatWrapping } from 'three/src/constants.js';
import { TextureLoader, Vector2 } from 'three';
import { FloorTextures } from '../../constants/textures';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { ArrayOfLength } from '../../libs/customPropTypes';

const floorThick = 1;

export function FloorGrid({
	position = [0, 0, 0],
	textureSource = FloorTextures[0].source,
	size = {width: 1, length: 1},
	onHover = () => {},
	onPointerDown = () => {},
}) {
	const isPointerOver = useRef();

	const textureMap = useMemo(() => {
		const txtLoader = new TextureLoader();
		const result = txtLoader.load(textureSource);
		result.wrapS = RepeatWrapping;
		result.wrapT = RepeatWrapping;

		return result;
	}, [textureSource]);

	useLayoutEffect(() => {
		textureMap.repeat = new Vector2(size.width/8, size.length/8);
	}, [textureMap, size]);

	const handlePointerMove = (e) => {
		if (isPointerOver.current) {
			try {
				const {x, y, z} = e.intersections[0].point;
				const point = {
					x: Number(x.toFixed(0)),
					y: Number(y.toFixed(0)),
					z: Number(z.toFixed(0)),
				};

				onHover([point.x, point.y, point.z]);
			} catch (error) {
				console.error(error);
			}
		}
	};

	const handlePointerEnter = () => {
		isPointerOver.current = true;
	};

	const handlePointerLeave = () => {
		onHover();
		isPointerOver.current = false;
	};

	return (
		<group position={position}>
			<mesh
				position={[size.width/2, -floorThick/2, size.length/2]}
				onPointerEnter={handlePointerEnter}
				onPointerLeave={handlePointerLeave}
				onPointerDown={onPointerDown}
				onPointerMove={handlePointerMove}
			>
				<boxGeometry args={[size.width, 1, size.length]} />
				<meshStandardMaterial
					displacementScale={0}
					map={textureMap}
				/>
			</mesh>
		</group>
	);
}

FloorGrid.propTypes= {
	position: ArrayOfLength.bind(null, 3),
	textureSource: PropTypes.oneOf(FloorTextures.map(({source}) => source)),
	size: PropTypes.shape({width: PropTypes.number, length: PropTypes.number}),
	selectedTile: PropTypes.number,
	onHover: PropTypes.func,
	onPointerDown: PropTypes.func,
};
