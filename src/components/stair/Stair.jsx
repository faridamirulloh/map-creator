import PropTypes from 'prop-types';
import { RepeatWrapping, TextureLoader, Vector2 } from 'three';
import { ArrayOfLength } from '../../libs/customPropTypes';
import { FloorTextures } from '../../constants/textures';
import { calculateAngleRad, calculateDistance3D, calculatePosition } from '../../libs/calcHelper';
import { useLayoutEffect, useMemo } from 'react';
import { StairWidth } from '../../constants/constant';

const stairThick = .3;

export function Stair({start = [0, 0, 0], end = [0, 0, 0], textureSource = FloorTextures[0].source}) {
	const stairLength = calculateDistance3D(start, end);

	const textureMap = useMemo(() => {
		const txtLoader = new TextureLoader();
		const result = txtLoader.load(textureSource);
		result.wrapS = RepeatWrapping;
		result.wrapT = RepeatWrapping;

		return result;
	}, [textureSource]);

	useLayoutEffect(() => {
		textureMap.repeat = new Vector2(stairLength/8, StairWidth/8);
	}, [textureMap, stairLength]);

	return (
		<mesh
			position={calculatePosition(start, end)}
			rotation={[0, calculateAngleRad(start[0], start[2], end[0], end[2]), calculateAngleRad((start[0] + start[2]), start[1], (end[0] + end[2]), end[1])]}
		>
			<boxGeometry args={[stairLength, stairThick, StairWidth]} />
			<meshStandardMaterial displacementScale={0} map={textureMap} />
		</mesh>
	);
}

Stair.propTypes = {
	start: ArrayOfLength.bind(null, 3),
	end: ArrayOfLength.bind(null, 3),
	textureSource: PropTypes.oneOf(FloorTextures.map(({source}) => source)),
};
