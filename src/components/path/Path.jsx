import { useLayoutEffect, useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader, Vector3 } from 'three';
import PropTypes from 'prop-types';
import { ArrayOfLength } from '../../libs/customPropTypes';
import { PointHeight } from '../../constants/constant';

const colorRed = '/textures/red-shine.jpg';
const colorGreen = '/textures/green-shine.jpg';
const lineColorGreen = 'green';
const lineColorRed = 'red';

export function Dot({position = [0, 0, 0]}) {
	const colorMap = useLoader(TextureLoader, colorRed);
	const objRef = useRef();

	return (
		<mesh ref={objRef} position={[position[0], position[1] + PointHeight, position[2]]}>
			<sphereGeometry args={[.3, 50, 50]} />
			<meshStandardMaterial
				displacementScale={0}
				map={colorMap}
			/>
		</mesh>
	);
}

Dot.propTypes = {
	position: ArrayOfLength.bind(null, 3),
};

export function Point({position = [0, 0, 0]}) {
	const colorMap = useLoader(TextureLoader, colorGreen);
	const objRef = useRef();

	return (
		<mesh ref={objRef} position={[position[0], position[1] + PointHeight, position[2]]}>
			<sphereGeometry args={[.25, 50, 50]} />
			<meshStandardMaterial
				displacementScale={0}
				map={colorMap}
			/>
		</mesh>
	);
}

Point.propTypes = {
	position: ArrayOfLength.bind(null, 3),
};

export function Path({start = [0, 0, 0], end = [0, 0, 0], error = false}) {
	const lineRef = useRef();

	useLayoutEffect(() => {
		if (lineRef.current) {
			lineRef.current.geometry.setFromPoints([
				new Vector3(start[0], start[1] + PointHeight, start[2]),
				new Vector3(end[0], end[1] + PointHeight, end[2]),
			]);
		}
	}, [end, start]);

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
	start: ArrayOfLength.bind(null, 3),
	end: ArrayOfLength.bind(null, 3),
	error: PropTypes.bool,
};
