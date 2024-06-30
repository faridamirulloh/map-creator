import PropTypes from 'prop-types';
import { RepeatWrapping, TextureLoader, Vector2 } from 'three';
import { ArrayOfLength } from '../../libs/customPropTypes';
import { WallTextures } from '../../constants/textures';
import { calculateAngleRad, calculateDistance, calculatePosition } from '../../libs/calcHelper';
import { useLayoutEffect, useMemo } from 'react';

const wallTick = 0.3;
const wallHeight = 3;

export function Wall({y = 0, start = [0, 0], end = [0, 0], textureSource = WallTextures[0].source, error = false}) {
	const wallLength = calculateDistance(...start, ...end);

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
		<mesh position={calculatePosition(start[0], y, start[1], end[0], y + wallHeight, end[1])} rotation={[0, calculateAngleRad(...start, ...end), 0]} >
			<boxGeometry args={[calculateDistance(...start, ...end), wallHeight, wallTick]} />
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
