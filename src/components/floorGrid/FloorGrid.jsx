import PropTypes from 'prop-types';
import { RepeatWrapping } from 'three/src/constants.js';
import { Bounds } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { TextureLoader, Vector2 } from 'three';
import { FloorTextures } from '../../constants/textures';

const floorTick = 1;

export function FloorGrid({
	textureSource = FloorTextures[0].source,
	size = {width: 1, length: 1},
	onHover = () => {},
	onPointerDown = () => {},
}) {
	const textureMap = useLoader(TextureLoader, textureSource);
	textureMap.repeat = new Vector2(size.width/7, size.length/7);
	textureMap.wrapS = RepeatWrapping;
	textureMap.wrapT = RepeatWrapping;

	const handlePointerMove = (e) => {
		try {
			const {x, y, z} = e.intersections[0].point;
			const point = {
				x: Number(x.toFixed(0)),
				y: Number(y.toFixed(0)),
				z: Number(z.toFixed(0)),
			};

			onHover([point.x, point.y, point.z]);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<Bounds fit clip observe margin={0.9}>
			<mesh
				position={[size.width/2, -floorTick/2, size.length/2]}
				// onPointerEnter={() => handleOnPointerEnter(id, [pos[0], pos[2]])}
				onPointerLeave={() => onHover()}
				onPointerDown={onPointerDown}
				onPointerMove={handlePointerMove}
			>
				<boxGeometry args={[size.width, 1, size.length]} />
				<meshStandardMaterial
					displacementScale={0}
					map={textureMap}
				/>
			</mesh>
		</Bounds>
	);
}

FloorGrid.propTypes= {
	textureSource: PropTypes.oneOf(FloorTextures.map(({source}) => source)),
	size: PropTypes.shape({width: PropTypes.number, length: PropTypes.number}),
	selectedTile: PropTypes.number,
	onHover: PropTypes.func,
	onPointerDown: PropTypes.func,
};
