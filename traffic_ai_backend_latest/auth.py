import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from decouple import config
from sqlalchemy.sql import select, insert
from database import database
from models import users
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext

# ✅ Correct jwt import from PyJWT
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Load secret key from environment variables
SECRET_KEY = config("SECRET_KEY", default="mysecretkey")

# Request body models
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Utility functions
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(data: dict, expires_delta: int = 60):
    """Generate JWT token with expiration"""
    logger.info(f"Generating JWT token for user: {data.get('sub')}")
    
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_delta)
    to_encode = data.copy()
    to_encode.update({"exp": expire})

    try:
        token = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
        return token
    except Exception as e:
        logger.error(f"Failed to generate JWT: {str(e)}")
        raise HTTPException(status_code=500, detail="Token generation failed")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get the current logged-in user from JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = payload.get("sub")

        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        query = select(users).where(users.c.email == email)
        user = await database.fetch_one(query)

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user

    except ExpiredSignatureError:
        logger.warning("JWT token expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except InvalidTokenError:
        logger.warning("Invalid JWT token")
        raise HTTPException(status_code=401, detail="Invalid token")

# Route to register a new user
@router.post("/register")
async def register_user(request: RegisterRequest):
    logger.info(f"Received registration request for email: {request.email}")

    query = users.select().where(users.c.email == request.email)
    existing_user = await database.fetch_one(query)
    if existing_user:
        logger.warning(f"Email already registered: {request.email}")
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(request.password)
    query = insert(users).values(name=request.name, email=request.email, password=hashed_password)
    await database.execute(query)
    
    logger.info(f"User {request.email} registered successfully")
    return {"message": "User registered successfully"}

# Route to login and receive JWT
@router.post("/login")
async def login_user(form_data: LoginRequest):
    logger.info(f"Login attempt for email: {form_data.email}")

    query = select(users).where(users.c.email == form_data.email)
    user = await database.fetch_one(query)

    if not user or not verify_password(form_data.password, user["password"]):
        logger.warning(f"Invalid login attempt for email: {form_data.email}")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_jwt_token({"sub": user["email"]})
    logger.info(f"Token issued for {form_data.email}")

    return {"access_token": token, "token_type": "bearer"}
