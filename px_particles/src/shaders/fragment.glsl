varying float vStrength;
varying float inside;

void main()
{

    // noglow
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float threshold = 0.085;// Adjust this value to control the size of the circle
    float strength = smoothstep(threshold - 0.1, threshold + 0.1, distanceToCenter);
    strength = 1.0 - strength;

    // glow
    // float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    // float strength = 0.02 / distanceToCenter - 0.04;

    float r = clamp(68.0 / 255.0 * vStrength, 0.0, 1.0);
    float g = clamp(229.0 / 255.0 * vStrength, 0.0, 1.0);
    float b = clamp(67.0 / 255.0 * vStrength, 0.0, 1.0);

    if (inside < 1.0){
        gl_FragColor = vec4(vStrength, vStrength, vStrength, strength);
    } else {
        gl_FragColor =vec4 (r*vStrength, g*vStrength, b*vStrength, strength);
    }

//    gl_FragColor = vec4(0,0,0,0);
}
