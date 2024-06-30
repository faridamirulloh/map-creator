import { useLayoutEffect, useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader, Vector3 } from 'three';
import PropTypes from 'prop-types';
import { ArrayOfLength } from '../../libs/customPropTypes';

const color = '/textures/red-shine.jpg';
const lineColorGreen = 'green';
const lineColorRed = 'red';
const pathHeight = 2;

export function Dot({position = [0, 0]}) {
	const colorMap = useLoader(TextureLoader, color);
	const objRef = useRef();

	return (
		<mesh ref={objRef} position={[position[0], pathHeight, position[1]]}>
			<sphereGeometry args={[.25, 50, 50]} />
			<meshStandardMaterial
				displacementScale={0}
				map={colorMap}
			/>
		</mesh>
	);
}

Dot.propTypes = {
	position: ArrayOfLength.bind(null, 2),
};

export function Path({y = 0, start = [0, 0], end = [0, 0], error = false}) {
	const lineRef = useRef();

	useLayoutEffect(() => {
		if (lineRef.current) {
			lineRef.current.geometry.setFromPoints([
				new Vector3(start[0], y + pathHeight, start[1]),
				new Vector3(end[0], y + pathHeight, end[1]),
			]);
		}
	}, [end, start, y]);

	return (
		<group>
			<Dot position={start} />
			<Dot position={end} />
			<line ref={lineRef}>
				<bufferGeometry />
				<lineBasicMaterial color={error? lineColorRed : lineColorGreen} />
			</line>
		</group>
	);
}

Path.propTypes = {
	id: PropTypes.number,
	y: PropTypes.number,
	start: ArrayOfLength.bind(null, 2),
	end: ArrayOfLength.bind(null, 2),
	error: PropTypes.bool,
};
