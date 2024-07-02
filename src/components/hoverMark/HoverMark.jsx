import PropTypes from 'prop-types';
import { useLoader } from '@react-three/fiber';
import { ArrayOfLength } from '../../libs/customPropTypes';
import { RepeatWrapping, TextureLoader, Vector2, Vector3 } from 'three';
import { useLayoutEffect, useRef } from 'react';
import { MapTools, MarkType } from '../../constants/dataEnum';
import { WallTextures } from '../../constants/textures';
import Text from '../text/Text';
import { PointHeight, WallHeight } from '../../constants/constant';

const color = '/textures/red-shine.jpg';

export function HoverMark({position = [0, 0, 0], type = MarkType.POINT, wallTexture = WallTextures[0].source, label = '', labelColor}) {
	const colorMap = useLoader(TextureLoader, color);
	const wallMap = useLoader(TextureLoader, wallTexture);
	wallMap.repeat = new Vector2(1/2, WallHeight/2);
	wallMap.wrapS = RepeatWrapping;
	wallMap.wrapT = RepeatWrapping;
	const lineRef = useRef();

	useLayoutEffect(() => {
		if (lineRef.current) lineRef.current.geometry.setFromPoints([ new Vector3(0, 0, 0), new Vector3(0, PointHeight, 0)]);
	}, [type]);

	const getObj = () => {
		switch (type) {
		case MarkType[MapTools.MANUAL_PATH]:
		case MarkType[MapTools.AUTO_PATH]:
		case MarkType[MapTools.POINT]:
			return (
				<>
					<mesh position={[0, PointHeight, 0]}>
						<sphereGeometry args={[.25, 50, 50]} />
						<meshStandardMaterial
							displacementScale={0}
							map={colorMap}
						/>
					</mesh>
					<line ref={lineRef}>
						<bufferGeometry />
						<lineBasicMaterial color='yellow'/>
					</line>
					{label ? <Text label={label} position={[0, PointHeight + .5, 0]} color={labelColor} /> : null}
				</>
			);

		case MarkType[MapTools.WALL]:
			return (
				<mesh position={new Vector3(0, WallHeight/2, 0)} >
					<boxGeometry args={[.5, WallHeight, .5]} />
					<meshStandardMaterial
						displacementScale={0}
						map={wallMap}
					/>
				</mesh>
			);

		default: return null;
		}
	};

	return (
		<group position={position}>
			{getObj()}
		</group>
	);
}

HoverMark.propTypes = {
	position: ArrayOfLength.bind(null, 3),
	type: PropTypes.oneOf(Object.values(MarkType)),
	wallTexture: PropTypes.oneOf(WallTextures.map(({source}) => source)),
	label: PropTypes.string,
	labelColor: PropTypes.string,
};
