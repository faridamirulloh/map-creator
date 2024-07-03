import PropTypes from 'prop-types';
import { RepeatWrapping } from 'three/src/constants.js';
import { TextureLoader, Vector2 } from 'three';
import { FloorTextures } from '../../constants/textures';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { ArrayOfLength } from '../../libs/customPropTypes';
import { FloorType, ObjectType } from '../../constants/dataEnum';

const floorThick = 1;

export function FloorGrid({
	id = 0,
	position = [0, 0, 0],
	textureSource = FloorTextures[0].source,
	size = {width: 1, length: 1},
	type = FloorType.FLAT,
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

	if (isPointerOver.current) console.log(position[1]);

	return (
		<group position={position}>
			<mesh
				name={ObjectType.FLOOR}
				userData={{type, id}}
				position={[size.width/2, -floorThick/2, size.length/2]}
				onPointerDown={onPointerDown}
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
	id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	position: ArrayOfLength.bind(null, 3),
	textureSource: PropTypes.oneOf(FloorTextures.map(({source}) => source)),
	size: PropTypes.shape({width: PropTypes.number, length: PropTypes.number}),
	selectedTile: PropTypes.number,
	type: PropTypes.oneOf(Object.values(FloorType)),
	onPointerDown: PropTypes.func,
};
