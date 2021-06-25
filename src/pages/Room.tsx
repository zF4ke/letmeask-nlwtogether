import { FormEvent, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import logoImg from '../assets/images/logo.svg'
import { Button } from '../components/Button'
import { RoomCode } from '../components/RoomCode'
import { useAuth } from '../hooks/useAuth'
import { database } from '../services/firebase'

import '../styles/room.scss'

type FirebaseQuestions = Record<string, {
    author: {
        name: string;
        avatar: string;
    }
    content: string;
    isHighlighted: boolean;
    isAnswered: boolean;
}>

type Question = {
    id: string | null;
    author: {
        name: string;
        avatar: string;
    }
    content: string;
    isHighlighted: boolean;
    isAnswered: boolean;
}

type RoomParams = {
    id: string;
}

export function Room() {
    const { user } = useAuth()
    const params = useParams<RoomParams>()
    const [newQuestion, setNewQuestion] = useState('')
    const [questions, setQuestions] = useState<Question[]>([])
    const [title, setTitle] = useState('')

    const roomId = params.id

    useEffect(() => {
        const roomRef = database.ref(`/rooms/${roomId}`)

        roomRef.once('value', room => {
            const databaseRoom = room.val()
            const firebaseQuestions: FirebaseQuestions = databaseRoom.questions ?? {}
        
            const parsedQuestions = Object.entries(firebaseQuestions).map(([key, value]) => {
                return {
                    id: key,
                    content: value.content,
                    author: value.author,
                    isHighlighted: value.isHighlighted,
                    isAnswered: value.isAnswered
                }
            })
        
            setTitle(databaseRoom.title)
            setQuestions(parsedQuestions)
        })

        roomRef.child('questions').on('child_added', snapshot => {
            const question : Question = snapshot.val()
            
            const nQuestion = {
                id: snapshot.key,
                content: question.content,
                author: question.author,
                isHighlighted: question.isHighlighted,
                isAnswered: question.isAnswered
            }

            if(questions.find(q => q.id === nQuestion.id)) return

            setQuestions(oldQuestions => [...oldQuestions, nQuestion])
        })

        roomRef.child('questions').on('child_removed', snapshot => {
            const question : Question = snapshot.val()

            const cQuestion = {
                id: snapshot.key,
                content: question.content,
                author: question.author,
                isHighlighted: question.isHighlighted,
                isAnswered: question.isAnswered
            }

            setQuestions(questions.filter((q : Question) => q.id !== cQuestion.id))
        }) 
        
        
        roomRef.child('questions').on('child_changed', snapshot => {
            const question : Question = snapshot.val()

            const cQuestion = {
                id: snapshot.key,
                content: question.content,
                author: question.author,
                isHighlighted: question.isHighlighted,
                isAnswered: question.isAnswered
            }

            const index = questions.findIndex((q : Question) => q.id === cQuestion.id)
            const newQuestions = questions
            newQuestions[index] = cQuestion

            setQuestions(newQuestions)

        })


    }, [questions, roomId])

    async function handleSendQuestion(event: FormEvent) {
        event.preventDefault()

        if(newQuestion.trim() === '') return
        if(!user) throw new Error('You must be logged in')

        const question = {
            content: newQuestion.trim(),
            author: {
                name: user.name,
                avatar: user.avatar
            },
            isHighlighted: false,
            isAnswered: false
        }

        await database.ref(`rooms/${roomId}/questions`).push(question)
        setNewQuestion('')
    }

    return(
        <div id="page-room">
            <header>
                <div className="content">
                    <img src={logoImg} alt="Logo" />
                    <RoomCode code={roomId} />
                </div>
            </header>
            <main>
                <div className="room-title">
                    <h1>Sala {title}</h1>
                    { questions.length === 1 && <span>1 pergunta</span> }
                    { questions.length > 1 && <span>{questions.length} perguntas</span> }
                </div>
                <form onSubmit={handleSendQuestion}>
                    <textarea
                        placeholder="O que você quer perguntar?"
                        onChange={event => setNewQuestion(event.target.value)}
                        value={newQuestion}
                    />
                    <div className="form-footer">
                        { user ? (
                            <div className="user-info">
                                <img src={user.avatar} alt={user.name} />
                                <span>{user.name}</span>
                            </div>
                        ) : (
                            <span>Para enviar uma pergunta, <button>faça seu login.</button></span>
                        ) }
                        <Button type="submit" disabled={!user}>Enviar pergunta</Button>
                    </div>
                </form>
                <p>{JSON.stringify(questions)}</p>
            </main>
        </div>
    )
}