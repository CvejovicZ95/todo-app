import bcrypt from 'bcrypt'
import { User } from '../models/usersSchema.js'
import { generateTokenAndSetCookie } from '../utils/generateToken.js'
import { logger } from '../../logger.js'

export const register = async (req, res) => {
    try {
        const { username, password, fullName} = req.body

        logger.info('Reqistration request:', req.body)

        const user = await User.findOne({ username })
        const name = await User.findOne({ fullName })

        if (user) {
            logger.error('Username already exist')
            return res.status(400).json({ error: 'Username already exist'})
        }

        if (name) {
            logger.error('This name is already in use')
            return res.status(400).json({ error: 'Name already in use'})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            username,
            password:hashedPassword,
            fullName
        })

        if (newUser) {
            const token = generateTokenAndSetCookie(newUser._id, res)
            await newUser.save()

            logger.info('User registred successfully:', newUser.username)

            res.status(201).json({
                token,
                _id:newUser._id,
                username:newUser.username,
                fullName:newUser.fullName
            })
        } else {
            logger.error('Invalid user data')
            res.status(400).json({ error: 'Invalid user data '})
        }
    } catch (error) {
        logger.error('Error in register controller:', error.message)
        res.status(500).json({ error: 'Server error'})
    }
}

export const login = async (req, res) => {
    try {
       const { username, password } = req.body
       const user = await User.findOne({ username })
       const isPasswordCorrect = await bcrypt.compare(password, user.password || '')
       
       if (!user || !isPasswordCorrect) {
        logger.error('Wrong username or password')
        return res.status(400).json({ error: 'Wrong username or password'})
       }

       const token = generateTokenAndSetCookie(user._id, res)

       logger.info('User logged in successfully:', user.username)

       res.status(200).json({
        token,
        _id:user._id,
        username:user.username
       })
    } catch (error) {
        logger.error('Error in login controller:', error.message)
        res.status(500).json({ error: 'Server error'})
    }
}

export const logout = async (req, res) => {
    try {
        res.cookie('token', '', {maxAge: 0})
        logger.info('User logged out successfully')
        res.status(200).json({ message: 'Logged out successfully'})
    } catch (error) {
        logger.error('Error in logout controller:', error.message)
        res.status(500).json({ error: 'Server error' })
    }
}