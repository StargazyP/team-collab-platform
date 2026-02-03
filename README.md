This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

1. Copy `.env.example` to `.env`
2. Fill in environment variables
3. Run `docker-compose up -d`
4. Run `npm install && npm run dev`


## 02-03 Mypage
1. 마이페이지, 로그인 , 회원가입 구현
2. jwt, mysql 연동구현
3. mysql은 docker에 올려놓고 나머지는 로컬에서 개발
4. docker-compose-dev.yml로 개발환경 구현
5. docker compose -f docker-compose-dev.yml up -d 로 빌드
5. docker compose -f docker-copose-dev.yml down 으로 삭제