FROM python:3.11-slim

RUN apt-get update && apt-get install -y wget unzip default-jre libgomp1 && rm -rf /var/lib/apt/lists/*

WORKDIR /opt
RUN wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip \
    && unzip sonar-scanner-cli-5.0.1.3006-linux.zip \
    && rm sonar-scanner-cli-5.0.1.3006-linux.zip \
    && mv sonar-scanner-5.0.1.3006-linux sonar-scanner

ENV PATH="/opt/sonar-scanner/bin:${PATH}"

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]