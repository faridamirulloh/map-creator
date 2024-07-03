import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import PropTypes from 'prop-types';
import { degToRad } from 'three/src/math/MathUtils.js';

const size = .8;
const pinHeight = -.5;
const bounceSpeed = 1;
const bounceWidth = .3;

const PinObject = ({ color = 'white', ...props }) => {
	const objRef = useRef();

	useFrame(({ clock }) => {
		const a = clock.getElapsedTime();
		const mod1 = a % bounceSpeed;
		const mod2 = a % (bounceSpeed*2);
		let pos = mod2 < bounceSpeed ? mod1 : bounceSpeed - mod1;

		objRef.current.position.y = (pos/(bounceSpeed/bounceWidth)) + 2;
		objRef.current.rotation.y = a;
	});

	return (
		<group position={[0, pinHeight, 0]}>
			<mesh ref={objRef} {...props} rotation={[degToRad(180), 0, 0 ]}>
				<coneGeometry args={[size/2, size, 3]}/>
				<meshBasicMaterial color={color} />
			</mesh>
		</group>
	);
};

PinObject.propTypes = {
	color: PropTypes.string,
};

export default PinObject;
