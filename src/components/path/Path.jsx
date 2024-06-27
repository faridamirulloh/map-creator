import { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import PropTypes from 'prop-types';
import { ArrayOfLength } from '../../libs/customPropTypes';

const color = './public/textures/green-shine.jpg';
const pathHeight = 2;
const bounceInterval = 1.5;
const bounceWidth = .3;

export function Dot({position = [0, 0], isOdd = false}) {
	const colorMap = useLoader(TextureLoader, color);
	const objRef = useRef();

	useFrame(({ clock }) => {
		const a = clock.getElapsedTime();
		const mod1 = a % bounceInterval;
		const mod2 = a % (bounceInterval*2);
		let pos = mod2 < bounceInterval ? mod1 : bounceInterval - mod1;

		if (isOdd) pos = 1 - pos;

		objRef.current.position.y = (pos/(bounceInterval/bounceWidth)) + 2;
	});

	return (
		<mesh ref={objRef} position={[position[0], pathHeight, position[1]]}>
			<sphereGeometry args={[.4, 50, 50]} />
			<meshStandardMaterial
				displacementScale={0}
				map={colorMap}
			/>
		</mesh>
	);
}

Dot.propTypes = {
	position: ArrayOfLength.bind(null, 2),
	isOdd: PropTypes.bool,
};

export function Path({line = {start: [0, 0], end: [5, -5]}}) {

	const pathArray = useMemo(() => {
		const {start, end} = line;
		const distanceX = start[0] - end[0];
		const distanceY = start[1] - end[1];
		const count = Math.max(Math.abs(distanceX), Math.abs(distanceY));
		const array = [];

		for (let space = 0; space < count; space+= 1.2) {
			array.push([start[0] - ((distanceX/count)*space), start[1] - ((distanceY/count)*space)]);
		}

		console.log(line);
		console.log(array);
		return array;
	}, [line]);

	return pathArray.map((pos, i) => <Dot key={i} position={pos} isOdd={i%2 === 1} />);
}

Path.propTypes = {
	line: PropTypes.shape({ start: ArrayOfLength.bind(null, 2), end: ArrayOfLength.bind(null, 2) }),
};
