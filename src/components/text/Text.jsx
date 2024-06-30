import PropTypes from 'prop-types';
import { extend } from '@react-three/fiber';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { HelvetikerRegular } from '../../assets/fonts';
import { ArrayOfLength } from '../../libs/customPropTypes';

extend({ TextGeometry });
const defaultFont = new FontLoader().parse(HelvetikerRegular);

function Text({label = '', position = [0, 0, 0], color = 'green', size = .3, width = .05}) {
	return (
		<mesh position={position}>
			<textGeometry args={[label, {font: defaultFont, size, depth: width}]}/>
			<meshLambertMaterial attach='material' color={color}/>
		</mesh>
	);
}

Text.propTypes = {
	label: PropTypes.string,
	position: ArrayOfLength.bind(null, 3),
	color: PropTypes.string,
	size: PropTypes.number,
	width: PropTypes.number,
};

export default Text;
