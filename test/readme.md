# Testing
Use command `docker-compose up` to initiate the Yomi app test images.\

Once the containers are running, navigate to `http://localhost:8080` to view the app in action.\
Also check `http://localhost:6969` to see if the server is working as intended.

## Prerequisites to Run the Images.
- Docker and Docker-Compose installed on your machine.
- Valid manga in the [`volume`](./data/). \
  For this, create a directory in the [`./data`](./data) directory named `manga` and put in folders of manga.\
  Manga folders should consist of JPG or PNG formate pages.\
  Eg:
  ```
  -/data/
       - /collections.json
       - /manga/
          - /yourManga1/
             - /1.jpg
             - /2.jpg
  ```
  
  ## Build your own Image.
  You can build your own images for Yomi.\
  To build your own image for the:
  - Server:\
    Run the command `docker build -t yourname/yomiserver:test . --no-cache` in the [Server directory](../Server)
  - Webapp:\
    Run the command `docker build -t yourname/yomiapp:test . --no-cache` in the [YomiApp directory](../YomiApp)
    
    
