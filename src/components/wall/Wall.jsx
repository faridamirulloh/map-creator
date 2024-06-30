import PropTypes from 'prop-types';
import { RepeatWrapping, TextureLoader, Vector2 } from 'three';
import { ArrayOfLength } from '../../libs/customPropTypes';
import { WallTextures } from '../../constants/textures';
import { calculateAngleRad, calculateLength, calculatePosition } from '../../libs/calcHelper';
import { useLayoutEffect, useMemo } from 'react';

const wallHeight = 3;

export function Wall({y = 0, start = [0, 0], end = [10, 10], textureSource = WallTextures[0].source, error = false}) {
	const wallLength = calculateLength(...start, ...end);

	const textureMap = useMemo(() => {
		const txtLoader = new TextureLoader();
		const result = txtLoader.load(textureSource);
		result.wrapS = RepeatWrapping;
		result.wrapT = RepeatWrapping;

		return result;
	}, [textureSource]);

	useLayoutEffect(() => {
		textureMap.repeat = new Vector2(wallLength/2, wallHeight/2);
	}, [textureMap, wallLength]);

	return (
		<mesh position={calculatePosition(start[0], y, start[1], end[0], y+wallHeight, end[1])} rotation={[0, calculateAngleRad(...start, ...end), 0]} >
			<boxGeometry args={[calculateLength(...start, ...end), wallHeight, 1]} />
			{ error
				? <meshBasicMaterial color='red' />
				: <meshStandardMaterial displacementScale={0} map={textureMap} />
			}
		</mesh>
	);
}

Wall.propTypes = {
	y: PropTypes.number,
	start: ArrayOfLength.bind(null, 2),
	end: ArrayOfLength.bind(null, 2),
	textureSource: PropTypes.oneOf(WallTextures.map(({source}) => source)),
	error: PropTypes.bool,
};
