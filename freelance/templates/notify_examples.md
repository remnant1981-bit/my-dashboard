# 알림 채널 구현 예시 (03_scheduled_notify.py 의 notify 교체용)

## 슬랙 웹훅
```python
import os, requests
def notify(msg: str) -> None:
    requests.post(os.environ["SLACK_WEBHOOK_URL"], json={"text": msg}, timeout=10)
```

## 텔레그램 봇
```python
import os, requests
def notify(msg: str) -> None:
    token, chat = os.environ["TG_TOKEN"], os.environ["TG_CHAT_ID"]
    requests.post(f"https://api.telegram.org/bot{token}/sendMessage",
                  data={"chat_id": chat, "text": msg}, timeout=10)
```

## 메일(SMTP)
```python
import os, smtplib
from email.message import EmailMessage
def notify(msg: str) -> None:
    m = EmailMessage(); m["Subject"] = "변경 알림"; m["From"] = os.environ["MAIL_FROM"]
    m["To"] = os.environ["MAIL_TO"]; m.set_content(msg)
    with smtplib.SMTP_SSL(os.environ["SMTP_HOST"], 465) as s:
        s.login(os.environ["SMTP_USER"], os.environ["SMTP_PASS"]); s.send_message(m)
```

주의: 토큰·비밀번호는 코드에 쓰지 말고 환경변수로 전달. 의뢰인 계정 정보는 납품 후 파기.
