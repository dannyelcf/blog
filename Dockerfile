FROM ruby:2.7.5
RUN apt-get update -qq && apt-get install -y nodejs npm sqlite3 
RUN npm install --global yarn
RUN gem install rails -v 6.1.6

EXPOSE 3000

CMD ["bash"]
