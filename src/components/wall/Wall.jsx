import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { ArrayOfLength } from '../../libs/customPropTypes';
import { IS_DEV } from '../../constants/constant';

const name = (type) => `.${IS_DEV? '/public' : ''}/textures/paving-stones-${type}.jpg`;
const stone = `.${IS_DEV? '/public' : ''}/textures/stone.jpg`;

const wallHeight = 3;

export function Wall({position = [0, 0]}) {
	const [
		colorMap,
		displacementMap,
		normalMap,
		roughnessMap,
		aoMap,
	] = useLoader(TextureLoader, [
		name('color'),
		name('displacement'),
		name('normal'),
		name('roughness'),
		name('ambientOcclusion'),
	]);

	const stoneColor = useLoader(TextureLoader, stone);

	return (
		<mesh position={[position[0], wallHeight / 2, position[1]]}>
			<boxGeometry args={[1, wallHeight, 1]} />
			<meshStandardMaterial
				displacementScale={0}
				map={stoneColor}
				// displacementMap={displacementMap}
				// normalMap={normalMap}
				// roughnessMap={roughnessMap}
				// aoMap={aoMap}
			/>
		</mesh>
	);
}

Wall.propTypes = {
	position: ArrayOfLength.bind(null, 2),
};
