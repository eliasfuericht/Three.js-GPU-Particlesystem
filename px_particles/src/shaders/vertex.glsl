uniform float uTime;
uniform float uTime2;
uniform float uPixelRatio;
uniform float uSize;
uniform float uFactor;
uniform float uSpeed;
uniform float uScroll;

uniform vec3 uOrigin;
uniform vec3 uRaycastOrigin;
uniform vec3 uRaycastDirection;
uniform vec3 uCameraPosition;

attribute float aScale;
attribute float aIndex;
attribute vec3 aStartPosition;
attribute vec3 aTargetPosition;
attribute vec3 aParticleStartPosition;

varying float vStrength;
varying float inside;

bool hitClimax = false;

struct RayDistanceInfo {
    float distance;
    vec3 direction;
};

RayDistanceInfo calcRayDistance(vec3 rayCastOrigin, vec3 rayCastDirection, vec3 particlePosition) {

    vec3 u = particlePosition - rayCastOrigin;

    vec3 w1 = (dot(u, rayCastDirection)/(length(rayCastDirection)*length(rayCastDirection))) * rayCastDirection;

    vec3 w2 = u-w1;

    //normalized directional vector from ray to particle
    vec3 w2norm = normalize(w2);

    //shortest distance from ray to particle
    float distance = length(w2);

    return RayDistanceInfo(distance, w2norm);
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,
    vec2(12.9898, 78.233)))*
    43758.5453123);
}

//move object to origin, rotate, move back to position
mat4 moveToPosition(vec4 position){
    return mat4(
    vec4(1.0, 0.0, 0.0, 0.0),
    vec4(0.0, 1.0, 0.0, 0.0),
    vec4(0.0, 0.0, 1.0, 0.0),
    vec4(-position.x, -position.y, -position.z, 1.0)
    );
}

mat4 rotate(float axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);

    if (axis == 1.0) {
        // Rotate around X-Axis
        return mat4(
        vec4(1.0, 0.0, 0.0, 0.0),
        vec4(0.0, c, -s, 0.0),
        vec4(0.0, s, c, 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
        );
    } else if (axis == 2.0) {
        // Rotate around Y-Axis
        return mat4(
        vec4(c, 0.0, s, 0.0),
        vec4(0.0, 1.0, 0.0, 0.0),
        vec4(-s, 0.0, c, 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
        );
    } else if (axis == 3.0) {
        // Rotate around Z-Axis
        return mat4(
        vec4(c, -s, 0.0, 0.0),
        vec4(s, c, 0.0, 0.0),
        vec4(0.0, 0.0, 1.0, 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
        );
    }
    return mat4(1.0);
}

mat4 rotateXYZ(float angleX, float angleY, float angleZ) {
    mat4 rotationMatrixX = rotate(1.0, angleX);
    mat4 rotationMatrixY = rotate(2.0, angleY);
    mat4 rotationMatrixZ = rotate(3.0, angleZ);

    return rotationMatrixZ * rotationMatrixY * rotationMatrixX;
}

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    RayDistanceInfo mouseInteraction = calcRayDistance(uCameraPosition, uRaycastDirection, position);

    vec3 dirFromMouse = mouseInteraction.direction * (1.0 / mouseInteraction.distance);

    RayDistanceInfo bubbleLook  = calcRayDistance(uCameraPosition, aStartPosition-uCameraPosition, position);

//    if()

    vec3 dirFromRay = bubbleLook.direction * (0.5 / bubbleLook.distance);

    // Used for sphere movement - spheres moving toward origin
    vec4 dirStartToOrigin = normalize(vec4(uOrigin - aStartPosition, 0.0));

    // Used for particle movement individually - particles moving on the surface
    vec4 dirStartToParticle = normalize(vec4(aStartPosition - aParticleStartPosition, 0.0));

    //    float animationConstant = sin(uTime / uSpeed + uScroll);
    float animationConstant = sin(uTime / uSpeed);
    float secAnimationConstant = sin(uTime2 / uSpeed);

    //calculate randomvalues for construction effect at start
    vec4 randomPos = vec4(random(modelPosition.xx)-0.5, random(modelPosition.yy)-0.5, random(modelPosition.zz)-0.5, 1.0);
    vec4 desiredPos = mix(randomPos, modelPosition, 1.0 / (0.5 * animationConstant + 0.5));

    // Actual Movement
    //movement of spheres towards center
    modelPosition += dirStartToOrigin * (animationConstant / uFactor);
    //movement of individual particles inward and outward
    modelPosition += dirStartToParticle * (max(0.05 * sin((uTime2 + aScale)),0.0));
    //uuuuultraspread to compact sphere
    modelPosition += desiredPos + vec4(dirFromRay * random(vec2(aIndex, aScale)) * 0.25, 1.0);
    //rotation of whole object
    modelPosition += modelPosition * rotateXYZ(0.5*animationConstant-0.55, 0.5*animationConstant-0.55, 0.5 * animationConstant - 0.55);
    //constant movement
    modelPosition = modelPosition * rotateXYZ(secAnimationConstant/15.0, secAnimationConstant/15.0, secAnimationConstant/15.0);
//    modelPosition = modelPosition - vec4(dirFromMouse,1.0);


    // Changing coloropacity over time
    vStrength = 0.5 * animationConstant + 0.8;

    // Changing color when inside boundingbox
    inside = 0.0;
    if (modelPosition.x < 0.5 && modelPosition.x > -0.5 && modelPosition.y <1.0 && modelPosition.y > -0.25) {
        inside = 1.0;
    }

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;
    gl_Position = projectionPosition;

    gl_PointSize = aScale * uSize * uPixelRatio;
    gl_PointSize *= (1.0 / -viewPosition.z);
}