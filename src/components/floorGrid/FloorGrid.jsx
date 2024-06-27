import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { DoubleSide } from 'three/src/constants.js';
import { Bounds } from '@react-three/drei';

const defaultColor = 0x4CBEE4;
const hoverColor = 0xDEE64C;
const selectedColor = 0xE44C4C;

export function FloorGrid({
	size = {width: 1, length: 1},
	selectedTile = null,
	onHover = () => {},
	onPointerDown = () => {},
}) {
	const [hoverId, setHoverId] = useState();

	const grid = useMemo(() => {
		const result = [];

		for (let x = 1; x < size.width; x++) {
			for (let y = 0; y < size.length; y++) {
				result.push([x, 0, -y]);
			}
		}

		return result;
	}, [size.length, size.width]);

	const handleOnPointerEnter = (id, pos) => {
		setHoverId(id);
		onHover(id, pos);
	};

	return grid.length > 0 ? (
		<>
			<Bounds fit clip observe margin={0.9}>
				{/* <mesh
					position={[-1, 0, -1]}
					rotation={[-Math.PI / 2, 0, 0]}
				>
					<planeGeometry args={[.9, .9]}/>
					<meshBasicMaterial color={hoverColor} />
				</mesh> */}
				{grid.map((pos, id) => (
					<mesh
						key={id}
						position={pos}
						rotation={[-Math.PI / 2, 0, 0]}
						onPointerEnter={() => handleOnPointerEnter(id, [pos[0], pos[2]])}
						onPointerLeave={() => setHoverId()}
						onPointerDown={() => onPointerDown(id, [pos[0], pos[2]])}
					>
						<planeGeometry args={[.9, .9]}/>
						<meshBasicMaterial
							color={hoverId === id ? hoverColor : selectedTile === id ? selectedColor : defaultColor}
							side={DoubleSide}
						/>
					</mesh>
				))}
			</Bounds>
		</>
	) : null;
}

FloorGrid.propTypes= {
	size: PropTypes.shape({width: PropTypes.number, length: PropTypes.number}),
	selectedTile: PropTypes.number,
	onHover: PropTypes.func,
	onPointerDown: PropTypes.func,
};
