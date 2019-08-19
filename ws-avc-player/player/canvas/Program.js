'use strict'
import assert from 'utils/assert'

export default class Program {
    constructor (gl) {
        this.gl = gl
        this.program = this.gl.createProgram()
    }
    attach (shader) {
        this.gl.attachShader(this.program, shader.shader)
    }
    link () {
        this.gl.linkProgram(this.program)
        // If creating the shader program failed, alert.
        assert(this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS),
            'Unable to initialize the shader program.')
    }
    use () {
        this.gl.useProgram(this.program)
    }
    getAttributeLocation (name) {
        return this.gl.getAttribLocation(this.program, name)
    }
    setMatrixUniform (name, array) {
        const uniform = this.gl.getUniformLocation(this.program, name)
        this.gl.uniformMatrix4fv(uniform, false, array)
    }
}
